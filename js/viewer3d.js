/*
 * Visualizador 3D das máquinas.
 * Os modelos são montados com formas simples (sem arquivo externo) e podem
 * ser girados 360° arrastando. Os marcadores vermelhos aparecem nos pontos
 * onde o simulador detectou problema.
 * Depende apenas do Three.js (r128) carregado antes deste arquivo.
 */
(function (global) {
  'use strict';

  const C = {
    body: 0x294d3e,
    bodyLight: 0x436b55,
    bodyDark: 0x1f3f32,
    engine: 0x3a4a3a,
    dark: 0x2f3a31,
    tire: 0x23272a,
    rim: 0xc9cfc3,
    light: 0xf3efd8,
    cream: 0xe9e5d3,
    header: 0x789783,
    reel: 0x54615c,
    glass: 0xa9c6c2,
    spot: 0xe03a3a
  };

  // Ponto de cada peça em cada modelo (onde o marcador vermelho aparece).
  const ANCHORS = {
    trator: {
      motor: [1.3, 2.28, 0],
      hidraulica: [-1.75, 1.55, 0],
      transmissao: [0.2, 0.95, 0.5]
    },
    colheitadeira: {
      motor: [-1.9, 2.72, 0],
      hidraulica: [2.2, 1.4, 0.85],
      transmissao: [-0.9, 1.4, 0.98]
    }
  };

  const VIEWS = {
    trator: { target: [0, 1.3, 0], radius: 9.5, theta: 0.75, phi: 1.2, shadow: 9 },
    colheitadeira: { target: [0.4, 1.7, 0], radius: 12.5, theta: 0.75, phi: 1.2, shadow: 12 }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = (a) => {
    a = (a + Math.PI) % (Math.PI * 2);
    if (a < 0) a += Math.PI * 2;
    return a - Math.PI;
  };

  function std(color, extra) {
    const material = new THREE.MeshStandardMaterial(Object.assign(
      { color: color, roughness: 0.78, metalness: 0.08, flatShading: true }, extra || {}
    ));
    material.color.convertSRGBToLinear();
    return material;
  }

  // Bevelled side profile: depth is real geometry, not a flat image plane.
  function profile(parent, points, depth, x, y, z, color) {
    const shape = new THREE.Shape();
    points.forEach((p,i) => i ? shape.lineTo(p[0],p[1]) : shape.moveTo(p[0],p[1]));
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled:true, bevelThickness:.035, bevelSize:.035, bevelSegments:1, steps:1, curveSegments:1});
    const mesh = new THREE.Mesh(geo, std(color,{roughness:.53,metalness:.22}));
    mesh.position.set(x,y,z-depth/2); parent.add(mesh); return mesh;
  }

  function rod(parent, from, to, radius, color) {
    const a=new THREE.Vector3(...from), b=new THREE.Vector3(...to), delta=b.clone().sub(a);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),8),std(color,{metalness:.55,roughness:.48}));
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());parent.add(mesh);return mesh;
  }

  function cabin(parent, x, floor, width, depth, height) {
    const g=new THREE.Group();g.name='cabine';g.position.set(x,floor,0);parent.add(g);
    const back=-width/2, front=width/2, topFront=front-.17;
    for(const side of [-1,1]) {
      const z=side*depth/2;
      rod(g,[back,0,z],[back+.1,height,z*.92],.045,C.dark);
      rod(g,[front,0,z],[topFront,height,z*.92],.045,C.dark);
      const window=profile(g,[[back+.07,.12],[front-.06,.12],[topFront-.04,height-.08],[back+.14,height-.08]],.018,0,0,z,C.glass);
      window.material.dispose();window.material=std(C.glass,{transparent:true,opacity:.27,roughness:.18,metalness:.15,depthWrite:false});
      rod(g,[topFront,height*.75,z],[topFront+.15,height*.77,z+side*.3],.025,C.dark);
      box(g,.12,.22,.16,topFront+.15,height*.77,z+side*.32,C.dark);
      rod(g,[front-.1,.45,z+.025*side],[front-.1,.65,z+.025*side],.025,C.rim);
    }
    for(const xx of [back,front]) glass(g,.018,height-.12,depth-.12,xx,height/2,0);
    profile(g,[[back-.12,height],[front+.1,height],[front+.05,height+.13],[back-.06,height+.16]],depth+.15,0,0,0,C.bodyLight);
    box(g,.43,.12,.5,back+.4,.3,0,C.dark);box(g,.12,.48,.5,back+.16,.52,0,C.dark);
    rod(g,[front-.25,.15,0],[front-.32,.6,0],.035,C.dark);
    const steering=new THREE.Mesh(new THREE.TorusGeometry(.17,.025,6,16),std(C.dark));steering.position.set(front-.32,.63,0);steering.rotation.y=Math.PI/2;g.add(steering);
    return g;
  }

  function box(parent, w, h, d, x, y, z, color, extra) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(color, extra));
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  function cyl(parent, rt, rb, h, seg, x, y, z, color, rot) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), std(color));
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    parent.add(m);
    return m;
  }

  function glass(parent, w, h, d, x, y, z) {
    return box(parent, w, h, d, x, y, z, C.glass, {
      transparent: true, opacity: 0.4, roughness: 0.2, flatShading: false, depthWrite: false
    });
  }

  // Roda com garras na banda de rodagem. Eixo ao longo de z.
  function wheel(parent, r, w, x, z) {
    const g = new THREE.Group();
    g.name='roda-'+x+'-'+z;
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 28), std(C.tire)));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.56, r * 0.56, w + 0.04, 20), std(C.rim)));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, w + 0.1, 12), std(C.dark)));
    const lugs = 20;
    const tread=new THREE.InstancedMesh(new THREE.BoxGeometry(r*.12,w*.6,r*.23),std(C.tire,{roughness:.96}),lugs*2);
    const dummy=new THREE.Object3D();
    for (let i = 0; i < lugs; i++) {
      const a = (i / lugs) * Math.PI * 2;
      for(const side of [-1,1]) {dummy.position.set(Math.cos(a)*r*1.02,side*w*.22,Math.sin(a)*r*1.02);dummy.rotation.set(0,-a,side*.5);dummy.updateMatrix();tread.setMatrixAt(i*2+(side===1?1:0),dummy.matrix);}
    }
    g.add(tread);
    const bolts=new THREE.InstancedMesh(new THREE.CylinderGeometry(r*.045,r*.045,.055,6),std(C.rim,{roughness:.4,metalness:.7}),16);
    for(let i=0;i<8;i++) for(const side of [-1,1]) {const a=i*Math.PI/4;dummy.position.set(Math.cos(a)*r*.32,side*(w/2+.055),Math.sin(a)*r*.32);dummy.rotation.set(0,0,0);dummy.updateMatrix();bolts.setMatrixAt(i*2+(side===1?1:0),dummy.matrix);}g.add(bolts);
    g.rotation.x = Math.PI / 2;
    g.position.set(x, r * 1.1, z);
    parent.add(g);
  }

  function buildTractor() {
    const g = new THREE.Group();
    wheel(g, 0.95, 0.6, -1.0, 1.05);
    wheel(g, 0.95, 0.6, -1.0, -1.05);
    wheel(g, 0.6, 0.42, 1.45, 0.9);
    wheel(g, 0.6, 0.42, 1.45, -0.9);

    box(g, 3.4, 0.5, 0.9, 0, 1.0, 0, C.dark);
    box(g, 0.25, 0.25, 2.1, -1.0, 1.05, 0, C.dark);
    box(g, 0.2, 0.2, 1.8, 1.45, 0.66, 0, C.dark);

    // capô
    profile(g,[[0,0],[2,0],[2,.57],[1.72,.78],[.25,.94],[0,.78]],1.0,.2,1.25,0,C.body);
    box(g, 0.08, 0.62, 0.8, 2.22, 1.6, 0, C.dark);
    box(g, 0.08, 0.14, 0.2, 2.22, 1.95, 0.32, C.light);
    box(g, 0.08, 0.14, 0.2, 2.22, 1.95, -0.32, C.light);
    box(g, 0.25, 0.5, 0.8, 2.35, 1.0, 0, C.dark);
    cyl(g, 0.06, 0.06, 0.9, 10, 1.75, 2.55, 0.32, C.dark);

    // cabine
    box(g, 1.5, 0.12, 1.4, -0.55, 1.28, 0, C.dark);
    cabin(g,-.55,1.34,1.4,1.3,1.5);
    for(const side of [-1,1]) {
      for(let i=0;i<3;i++) box(g,.42,.07,.3,-.05,.62+i*.22,side*(.93-i*.05),C.dark);
      profile(g,[[-.8,0],[.8,0],[.66,.12],[-.65,.12]],.48,-1,2.1,side*1.05,C.body);
      for(let i=0;i<7;i++) box(g,.035,.32,.025,1.3+i*.1,1.7,side*.52,C.dark);
      rod(g,[-1.72,1.3,side*.25],[-2.2,.86,side*.45],.055,C.rim);
    }
    for(let i=0;i<8;i++) box(g,.03,.035,.75,2.27,1.35+i*.065,0,C.rim);

    // paralamas e engate traseiro
    box(g, 1.3, 0.08, 0.45, -1.0, 2.2, 1.05, C.body);
    box(g, 1.3, 0.08, 0.45, -1.0, 2.2, -1.05, C.body);
    box(g, 0.35, 0.5, 0.9, -1.7, 1.15, 0, C.bodyDark);
    box(g, 0.9, 0.08, 0.08, -2.0, 0.95, 0.35, C.dark);
    box(g, 0.9, 0.08, 0.08, -2.0, 0.95, -0.35, C.dark);
    inspectionParts(g,'trator');
    return g;
  }

  function buildHarvester() {
    const g = new THREE.Group();
    wheel(g, 0.9, 0.65, 0.8, 1.35);
    wheel(g, 0.9, 0.65, 0.8, -1.35);
    wheel(g, 0.55, 0.4, -2.0, 1.0);
    wheel(g, 0.55, 0.4, -2.0, -1.0);

    box(g, 3.0, 0.35, 1.3, 0, 1.0, 0, C.dark);
    box(g, 0.3, 0.3, 2.7, 0.8, 0.99, 0, C.dark);
    box(g, 0.2, 0.2, 2.0, -2.0, 0.6, 0, C.dark);

    // corpo, tanque de grãos e motor
    profile(g,[[-1.7,0],[1.7,0],[1.6,1.1],[.8,1.5],[-1.4,1.5],[-1.7,1.2]],1.9,0,1.15,0,C.body);
    profile(g,[[-1,0],[1,0],[1.15,.62],[-1.15,.62]],1.7,-.6,2.7,0,C.bodyLight);
    box(g, 0.9, 1.1, 1.4, -1.9, 2.0, 0, C.engine);
    cyl(g, 0.07, 0.07, 1.0, 10, -2.1, 3.1, 0.45, C.dark);

    // tubo de descarga
    cyl(g, 0.1, 0.1, 2.8, 10, -0.2, 3.68, 0.95, C.cream, [0, 0, Math.PI / 2]);
    box(g, 0.3, 0.25, 0.25, 1.3, 3.6, 0.95, C.cream);

    // cabine
    cabin(g,1.25,2.62,1.4,1.5,1.2);
    for(let i=0;i<5;i++) box(g,.4,.06,.42,.3,1+i*.3,1.15,C.dark);
    for(const side of [-1,1]) {for(let i=0;i<10;i++) box(g,.04,.45,.03,-1.6+i*.12,2.15,side*.97,C.dark);box(g,.12,.14,.3,1.97,2.65,side*.55,C.light);}

    // esteira alimentadora e plataforma de corte
    box(g, 1.1, 0.9, 1.6, 2.25, 1.45, 0, C.bodyDark);
    box(g, 0.9, 0.5, 4.4, 3.1, 0.9, 0, C.header);
    box(g, 1.0, 0.9, 0.08, 3.0, 1.1, 2.2, C.header);
    box(g, 1.0, 0.9, 0.08, 3.0, 1.1, -2.2, C.header);
    cyl(g,.08,.08,4.3,12,3.25,1.5,0,C.dark,[Math.PI/2,0,0]);
    for(let i=0;i<6;i++) {const a=i*Math.PI/3, x=3.25+Math.cos(a)*.46,y=1.5+Math.sin(a)*.46;
      rod(g,[x,y,-2.1],[x,y,2.1],.035,C.reel);
      for(const z of [-2,0,2]) rod(g,[3.25,1.5,z],[x,y,z],.025,C.reel);
      for(let j=0;j<12;j++) rod(g,[x,y,-2+j*.35],[x+.1,y-.14,-2+j*.35],.012,C.dark);
    }
    inspectionParts(g,'colheitadeira');
    return g;
  }

  function inspectionParts(g,type) {
    const anchors=ANCHORS[type];
    g.userData.inspection={};
    Object.keys(anchors).forEach(key=>{
      const a=anchors[key], part=new THREE.Group();part.name=key;part.userData.anchor=key;g.add(part);
      const y=key==='motor'?a[1]-.28:a[1];
      const housing=box(part,.52,.35,.55,a[0],y,a[2],C.engine,{metalness:.55,roughness:.5});
      housing.name=key+'-housing';
      for(let i=0;i<5;i++) box(part,.035,.39,.58,a[0]-.22+i*.11,y,a[2],C.dark);
      rod(part,[a[0]-.25,y,a[2]],[a[0]-.5,y-.3,a[2]],.045,C.rim);
      g.userData.inspection[key]=part;
    });
    let index=0;g.traverse(o=>{if(o.isMesh && !o.name)o.name='surface-'+index++;});
  }

  function shadowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const grad = x.createRadialGradient(128, 128, 10, 128, 128, 126);
    grad.addColorStop(0, 'rgba(25,45,30,0.38)');
    grad.addColorStop(0.55, 'rgba(25,45,30,0.14)');
    grad.addColorStop(1, 'rgba(25,45,30,0)');
    x.fillStyle = grad;
    x.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  function MachineViewer(el, opts) {
    this.el = el;
    this.onInspect = opts.onInspect;
    this.type = opts.type in VIEWS ? opts.type : 'trator';
    this.autoRotate = !!opts.autoRotate;
    this.inspecting = false;
    this.motionQuery = global.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionQuery.matches;
    this._motionChange = e => { this.reducedMotion = e.matches; };
    this.motionQuery.addEventListener('change', this._motionChange);
    this.alive = true;
    this.failed = false;
    this.dragging = false;
    this.pauseUntil = 0;
    this.goal = null;
    this.spots = [];
    this.sig = null;
    this.last = 0;
    this._loop = this._loop.bind(this);

    if (!global.THREE) {
      this._fail('Não foi possível carregar o 3D. Confira a conexão com a internet.');
      return;
    }
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      this._fail('Este navegador não conseguiu iniciar o 3D.');
      return;
    }

    const view = VIEWS[this.type];
    this.view = view;
    this.anchors = ANCHORS[this.type];
    this.target = new THREE.Vector3(view.target[0], view.target[1], view.target[2]);
    this.theta = view.theta;
    this.phi = view.phi;
    this.radius = view.radius;
    this.minR = view.radius * 0.45;
    this.maxR = view.radius * 1.5;

    const r = this.renderer;
    r.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1;
    r.domElement.tabIndex = 0;
    r.domElement.setAttribute('aria-label', 'Modelo 3D da máquina. Use as setas do teclado para girar.');
    el.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb29a, 0.65));
    const sun = new THREE.DirectionalLight(0xfff5e6, 1.2);
    sun.position.set(6, 10, 5);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdfeaf5, 0.35);
    fill.position.set(-6, 4, -5);
    this.scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(view.shadow, view.shadow),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(view.target[0], 0.01, 0);
    this.scene.add(floor);

    this.model = this.type === 'colheitadeira' ? buildHarvester() : buildTractor();
    this.scene.add(this.model);

    this.spotGroup = new THREE.Group();
    this.scene.add(this.spotGroup);
    this.setIssues(opts.issues || []);

    this._bind();
    this._resize();
    this.raf = requestAnimationFrame(this._loop);
  }

  MachineViewer.prototype._fail = function (msg) {
    this.failed = true;
    this.alive = false;
    const p = document.createElement('p');
    p.className = 'stage-msg';
    p.textContent = msg;
    this.el.appendChild(p);
  };

  MachineViewer.prototype._bind = function () {
    const self = this;
    const c = this.renderer.domElement;

    this._down = function (e) {
      self.inspecting = true;
      self.dragging = true;
      self.goal = null;
      self.lx = e.clientX;
      self.ly = e.clientY;
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* sem captura */ }
    };
    this._move = function (e) {
      if (!self.dragging) return;
      self.theta += (e.clientX - self.lx) * 0.008;
      self.phi = clamp(self.phi - (e.clientY - self.ly) * 0.006, 0.25, 1.5);
      self.lx = e.clientX;
      self.ly = e.clientY;
    };
    this._up = function () {
      self.dragging = false;
      self.pauseUntil = performance.now() + 2500;
    };
    this._wheel = function (e) {
      e.preventDefault();
      self.inspecting = true;
      self.goal = null;
      self.radius = clamp(self.radius * (1 + Math.sign(e.deltaY) * 0.08), self.minR, self.maxR);
    };
    this._key = function (e) {
      const step = 0.12;
      if (e.key === 'ArrowLeft') self.theta -= step;
      else if (e.key === 'ArrowRight') self.theta += step;
      else if (e.key === 'ArrowUp') self.phi = clamp(self.phi - step, 0.25, 1.5);
      else if (e.key === 'ArrowDown') self.phi = clamp(self.phi + step, 0.25, 1.5);
      else if (e.key === '+' || e.key === '=') self.radius=clamp(self.radius*.9,self.minR,self.maxR);
      else if (e.key === '-') self.radius=clamp(self.radius*1.1,self.minR,self.maxR);
      else return;
      e.preventDefault();
      self.goal = null;
      self.inspecting = true;
      self.pauseUntil = performance.now() + 2500;
    };

    c.addEventListener('pointerdown', this._down);
    c.addEventListener('pointermove', this._move);
    c.addEventListener('pointerup', this._up);
    c.addEventListener('pointercancel', this._up);
    c.addEventListener('wheel', this._wheel, { passive: false });
    c.addEventListener('keydown', this._key);

    if (global.ResizeObserver) {
      this._ro = new ResizeObserver(function () { self._resize(); });
      this._ro.observe(this.el);
    }
  };

  MachineViewer.prototype._resize = function () {
    const w = this.el.clientWidth || 1;
    const h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? Math.min(65, 38 * h / w) : 38;
    this.camera.updateProjectionMatrix();
  };

  // Atualiza os marcadores vermelhos. Só refaz quando algo mudou.
  MachineViewer.prototype.setIssues = function (issues) {
    if (this.failed) return;
    const sig = issues.map(function (i) { return i.anchor + ':' + i.level; }).join('|');
    if (sig === this.sig) return;
    this.sig = sig;

    this.spots.forEach(function (s) {
      s.core.geometry.dispose(); s.core.material.dispose();
      s.halo.geometry.dispose(); s.halo.material.dispose();
      if (s.label.parentNode) s.label.parentNode.removeChild(s.label);
    });
    this.spotGroup.clear();
    this.spots = [];

    const self = this;
    issues.forEach(function (issue) {
      const a = self.anchors[issue.anchor];
      if (!a) return;
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 16, 12),
        new THREE.MeshBasicMaterial({ color: issue.level === 2 ? C.spot : 0xd28a1f, depthTest: false })
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 16, 12),
        new THREE.MeshBasicMaterial({ color: issue.level === 2 ? C.spot : 0xd28a1f, transparent: true, opacity: 0.4, depthTest: false, depthWrite: false })
      );
      core.renderOrder = 10;
      halo.renderOrder = 9;
      core.position.set(a[0], a[1], a[2]);
      halo.position.copy(core.position);
      self.spotGroup.add(halo);
      self.spotGroup.add(core);

      const label = document.createElement('button');
      label.type='button';
      label.className = 'spot-label';
      label.style.pointerEvents='auto';
      label.style.border='1px solid currentColor';
      label.addEventListener('click',()=>self.focus(issue.anchor));
      label.textContent = issue.part;
      label.style.color = issue.level === 2 ? '#a52a2a' : '#865710';
      label.setAttribute('aria-label', issue.part + (issue.level === 2 ? ': crítico' : ': atenção'));
      self.el.appendChild(label);

      self.spots.push({ core: core, halo: halo, label: label, level: issue.level });
    });
  };

  // Gira a câmera até o ponto e aproxima.
  MachineViewer.prototype.focus = function (anchorKey) {
    if (this.failed) return;
    const a = this.anchors[anchorKey];
    if (!a) return;
    this.inspecting = true;
    this.autoRotate = false;
    if (this.onInspect) this.onInspect(anchorKey);
    Object.entries(this.model.userData.inspection || {}).forEach(([key,group])=>group.traverse(o=>{if(o.material && o.material.emissive) {o.material.emissive.setHex(key===anchorKey?0x789783:0x000000);o.material.emissiveIntensity=key===anchorKey?.35:0;}}));
    const dx = a[0] - this.view.target[0];
    const dz = a[2] - this.view.target[2];
    this.goal = {
      theta: Math.atan2(dz, dx) + 0.5,
      phi: 1.05,
      radius: this.view.radius * 0.62,
      target: new THREE.Vector3(
        this.view.target[0] + dx * 0.5,
        this.view.target[1] + (a[1] - this.view.target[1]) * 0.5,
        this.view.target[2] + dz * 0.5
      )
    };
    this.pauseUntil = performance.now() + 6000;
  };

  MachineViewer.prototype.resetView = function () {
    if (this.failed) return;
    const v = this.view;
    this.inspecting = false;
    Object.values(this.model.userData.inspection || {}).forEach(group=>group.traverse(o=>{if(o.material?.emissive)o.material.emissive.setHex(0x000000);}));
    this.goal = {
      theta: v.theta,
      phi: v.phi,
      radius: v.radius,
      target: new THREE.Vector3(v.target[0], v.target[1], v.target[2])
    };
  };

  MachineViewer.prototype.setAutoRotate = function (on) {
    this.autoRotate = !!on;
    if (on) this.inspecting = false;
  };

  MachineViewer.prototype._loop = function (now) {
    if (!this.alive) return;
    this.raf = requestAnimationFrame(this._loop);
    const dt = Math.min((now - (this.last || now)) / 1000, 0.1);
    this.last = now;
    if (document.hidden || !this.el.getClientRects().length) return;

    if (this.goal) {
      const g = this.goal;
      const k = this.reducedMotion ? 1 : 1 - Math.pow(0.001, dt);
      this.theta += wrap(g.theta - this.theta) * k;
      this.phi += (g.phi - this.phi) * k;
      this.radius += (g.radius - this.radius) * k;
      this.target.lerp(g.target, k);
      if (Math.abs(wrap(g.theta - this.theta)) < 0.003 &&
          Math.abs(g.phi - this.phi) < 0.003 &&
          Math.abs(g.radius - this.radius) < 0.02) {
        this.goal = null;
      }
    } else if (this.autoRotate && !this.inspecting && !this.reducedMotion && !this.dragging && now > this.pauseUntil) {
      this.theta += dt * 0.35;
    }

    const sp = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sp * Math.cos(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + this.radius * sp * Math.sin(this.theta)
    );
    this.camera.lookAt(this.target);

    this._animateSpots(now / 1000);
    this.renderer.render(this.scene, this.camera);
    this._placeLabels();
  };

  MachineViewer.prototype._animateSpots = function (t) {
    const size = this.radius / this.view.radius;
    const reduced = this.reducedMotion;
    this.spots.forEach(function (s) {
      const speed = s.level === 2 ? 1.4 : 0.8;
      const p = reduced ? 0 : (Math.sin(t * speed * 2) + 1) / 2;
      s.core.scale.setScalar(size);
      s.halo.scale.setScalar(size * (1.3 + p * .3));
      s.halo.material.opacity = reduced ? .2 : .25 - p * .08;
    });
  };

  MachineViewer.prototype._placeLabels = function () {
    const w = this.el.clientWidth;
    const h = this.el.clientHeight;
    const v = new THREE.Vector3();
    const camera = this.camera;
    const occupied = [];
    this.spots.forEach(function (s) {
      v.copy(s.core.position).project(camera);
      if (v.z > 1 || v.z < -1 || Math.abs(v.x)>1 || Math.abs(v.y)>1) {
        s.label.style.display = 'none';
        return;
      }
      s.label.style.display = '';
      s.label.style.left = clamp((v.x * 0.5 + 0.5) * w,0,Math.max(0,w-s.label.offsetWidth-20)) + 'px';
      let top=clamp((-v.y*.5+.5)*h,16,h-90);
      for(const previous of occupied) if(Math.abs(previous-top)<26) top=previous+26;
      occupied.push(top);
      s.label.style.top = clamp(top,16,h-70) + 'px';
    });
  };

  MachineViewer.prototype.destroy = function () {
    this.alive = false;
    this.motionQuery.removeEventListener('change', this._motionChange);
    if (this.failed) {
      this.el.textContent = '';
      return;
    }
    cancelAnimationFrame(this.raf);
    if (this._ro) this._ro.disconnect();
    const c = this.renderer.domElement;
    c.removeEventListener('pointerdown', this._down);
    c.removeEventListener('pointermove', this._move);
    c.removeEventListener('pointerup', this._up);
    c.removeEventListener('pointercancel', this._up);
    c.removeEventListener('wheel', this._wheel);
    c.removeEventListener('keydown', this._key);
    this.scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    this.renderer.dispose();
    if (this.renderer.forceContextLoss) this.renderer.forceContextLoss();
    this.el.textContent = '';
  };

  global.MachineViewer = MachineViewer;
})(window);
