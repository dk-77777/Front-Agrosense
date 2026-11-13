/* AgroSense · Cena isométrica do painel de login.
 * Gera em SVG uma fazenda demonstrativa em blocos (baixo polígono) e anima apenas máquinas e drone.
 * Contrato: window.AgroScene = { run }. login.js chama run() quando a coreografia de entrada começa.
 * Sem dependências. Dados puramente ilustrativos: nenhum número ou coordenada real.
 * Adicione ?debug à URL para validar trilhas e imprimir a contagem de nós SVG no console.
 */
(() => {
  'use strict';

  const DEBUG = /[?&]debug\b/.test(location.search);
  const host = document.querySelector('.ag-scene');
  const visual = document.querySelector('.ag-visual');
  if (!host || !visual) { window.AgroScene = { run() {} }; return; }

  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Geometria ---------- */
  const TW = 64, TH = 32, CH = 22;
  const P = (x, y, z = 0) => ({ sx: (x - y) * TW / 2, sy: (x + y) * TH / 2 - z * CH });
  const n2 = (n) => Math.round(n * 100) / 100;
  const pt = (x, y, z) => { const p = P(x, y, z); return n2(p.sx) + ',' + n2(p.sy); };
  const poly = (pts, fill) => `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${fill}"/>`;

  const mix = (a, b, t) => {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    return '#' + [16, 8, 0].map((s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, '0')).join('');
  };
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')).join('');
  };
  /* A cor informada é a do topo; esquerda é média e direita a mais escura (luz vem de cima à esquerda) */
  const tone = (c, l = .88, r = .74) => ({ t: c, l: shade(c, l), r: shade(c, r) });

  /* Caixa isométrica: topo, face esquerda (+y) e face direita (+x) */
  function box(x0, y0, z0, x1, y1, z1, c, o = {}) {
    let s = '';
    if (!o.noTop) s += poly([pt(x0, y0, z1), pt(x1, y0, z1), pt(x1, y1, z1), pt(x0, y1, z1)], c.t);
    s += poly([pt(x0, y1, z1), pt(x1, y1, z1), pt(x1, y1, z0), pt(x0, y1, z0)], c.l);
    s += poly([pt(x1, y0, z1), pt(x1, y1, z1), pt(x1, y1, z0), pt(x1, y0, z0)], c.r);
    return s;
  }
  /* Pirâmide (telhado de quatro águas ou copa de árvore) */
  function pyr(x0, y0, x1, y1, z, za, c, full) {
    const a = pt((x0 + x1) / 2, (y0 + y1) / 2, za);
    let s = '';
    if (full) {
      s += poly([pt(x0, y0, z), pt(x0, y1, z), a], c.t);
      s += poly([pt(x0, y0, z), pt(x1, y0, z), a], shade(c.t, .96));
    }
    return s + poly([pt(x0, y1, z), pt(x1, y1, z), a], c.l) + poly([pt(x1, y0, z), pt(x1, y1, z), a], c.r);
  }
  /* Prisma octogonal simplificado */
  function oct(cx, cy, r, z0, z1, c, noTop) {
    const n = 8, th = 2 * Math.PI / n, v = [];
    for (let k = 0; k < n; k++) v.push([cx + r * Math.cos((k + .5) * th), cy + r * Math.sin((k + .5) * th)]);
    let s = '';
    for (let k = 0; k < n; k++) {
      const a = v[k], b = v[(k + 1) % n], nx = Math.cos((k + 1) * th), ny = Math.sin((k + 1) * th);
      if (nx + ny <= 0.01) continue;
      s += poly([pt(a[0], a[1], z1), pt(b[0], b[1], z1), pt(b[0], b[1], z0), pt(a[0], a[1], z0)], mix(c.r, c.l, (ny - nx + 1) / 2));
    }
    if (!noTop) s += poly(v.map((q) => pt(q[0], q[1], z1)), c.t);
    return s;
  }
  /* Quadro sobre o plano y = Y (face esquerda) ou x = X (face direita) */
  const winL = (xa, xb, Y, za, zb, f) => poly([pt(xa, Y, za), pt(xb, Y, za), pt(xb, Y, zb), pt(xa, Y, zb)], f);
  const winR = (ya, yb, X, za, zb, f) => poly([pt(X, ya, za), pt(X, yb, za), pt(X, yb, zb), pt(X, ya, zb)], f);

  /* ---------- Mapa (fixo) ---------- */
  const MAP = [
    '...ggggggggg....',
    '..g1111r22222g..',
    '.gg1111r2222255.',
    '.gg1111r2222255.',
    '.gg1111r2222255.',
    '.rrrrrrrrrrrrrr.',
    'gsss4444r33333g.',
    'gsss4444r33333ww',
    'gsss4444r33333ww',
    'gsss4444r33333g.',
    '.gggggggggggg...',
    '..gggggggg......'
  ];
  const W = 16, H = 12;
  const kindAt = (x, y) => (y >= 0 && y < H && x >= 0 && x < W) ? MAP[y][x] : '.';

  const GALPAO = [];
  for (let y = 6; y <= 7; y++) for (let x = 1; x <= 3; x++) GALPAO.push([x, y]);
  const SILO = [2, 8], TORRE = [3, 9], CASA = [1, 9];
  const TREES = [[4, 0], [8, 0], [10, 0], [2, 1], [2, 3], [13, 1], [14, 9], [5, 10], [9, 10], [3, 11], [7, 11], [11, 10]];
  const SENSORS = [[14, 6], [2, 4], [8, 10]];
  const blocked = new Set([...GALPAO, SILO, TORRE, CASA, ...TREES, ...SENSORS].map((c) => c[0] + ',' + c[1]));

  /* PRNG com semente fixa: o mesmo resultado a cada carga */
  const mulberry32 = (a) => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  /* ---------- Paleta ---------- */
  const GRASS = ['#7FA56B', '#6E9A5A', '#8DB07A'];
  const GOLD = ['#D9C58A', '#CDB878', '#E2D09B'];
  const PLOW = ['#8A6A4F', '#7E6048', '#957459'];
  const ROAD = '#CBB892', WATER = '#A9CBD6';
  const DIRT_L = '#6B4F3A', DIRT_R = '#5A422F';
  const APP = {
    g: { tops: GRASS, sl: '#5E8650', sr: '#4C6F40' },
    gA: { tops: GRASS, sl: '#5E8650', sr: '#4C6F40', rows: 'A', line: '#4F7A45' },
    gB: { tops: GRASS, sl: '#5E8650', sr: '#4C6F40', rows: 'B', line: '#4F7A45' },
    oB: { tops: GOLD, sl: '#5E8650', sr: '#4C6F40', rows: 'B', line: '#B09A58' },
    pA: { tops: PLOW, sl: '#5E8650', sr: '#4C6F40', rows: 'A', line: '#6B4F3A' },
    r: { tops: [ROAD], sl: '#A89470', sr: '#8F7D5C' },
    w: { tops: [WATER], sl: null, sr: null }
  };
  const APP_OF = { g: 'g', s: 'g', r: 'r', w: 'w', 1: 'gA', 3: 'gA', 4: 'gB', 2: 'oB', 5: 'pA' };

  /* Cada variante de tile vira um <symbol-like> <g id> em defs, desenhado na célula (0,0) */
  const syms = new Map();
  function tileSym(app, tn, lv) {
    const id = `t-${app}-${tn}-${lv}`;
    if (syms.has(id)) return id;
    const a = APP[app], base = lv - 1, zs = lv - 1 / 3;
    let s = poly([pt(0, 0, lv), pt(1, 0, lv), pt(1, 1, lv), pt(0, 1, lv)], a.tops[tn]);
    if (a.rows) {
      let d = '';
      [.2, .4, .6, .8].forEach((b) => { d += a.rows === 'A' ? `M${pt(0, b, lv)}L${pt(1, b, lv)}` : `M${pt(b, 0, lv)}L${pt(b, 1, lv)}`; });
      s += `<path d="${d}" fill="none" stroke="${a.line}" stroke-width="1.6" stroke-opacity=".55" stroke-linecap="round"/>`;
    }
    if (app === 'w') s += `<path d="M${pt(.2, .4, lv)}L${pt(.5, .4, lv)}M${pt(.55, .7, lv)}L${pt(.8, .7, lv)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>`;
    const topL = a.sl ? zs : lv, topR = topL;
    if (a.sl) {
      s += poly([pt(0, 1, lv), pt(1, 1, lv), pt(1, 1, zs), pt(0, 1, zs)], a.sl);
      s += poly([pt(1, 0, lv), pt(1, 1, lv), pt(1, 1, zs), pt(1, 0, zs)], a.sr);
    }
    s += poly([pt(0, 1, topL), pt(1, 1, topL), pt(1, 1, base), pt(0, 1, base)], DIRT_L);
    s += poly([pt(1, 0, topR), pt(1, 1, topR), pt(1, 1, base), pt(1, 0, base)], DIRT_R);
    syms.set(id, `<g id="${id}">${s}</g>`);
    return id;
  }

  /* ---------- Limites da cena ---------- */
  const bb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  const grow = (x, y, z) => {
    const p = P(x, y, z);
    bb.x0 = Math.min(bb.x0, p.sx); bb.x1 = Math.max(bb.x1, p.sx);
    bb.y0 = Math.min(bb.y0, p.sy); bb.y1 = Math.max(bb.y1, p.sy);
  };
  const growCell = (gx, gy, z) => { grow(gx, gy, z); grow(gx + 1, gy, z); grow(gx, gy + 1, z); grow(gx + 1, gy + 1, z); };

  /* ---------- Tiles (camada de solo, ordenada por x + y do centro) ---------- */
  const rng = mulberry32(42);
  const ground = [];
  let uid = 0;
  const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = kindAt(x, y);
      if (k === '.') continue;
      const rA = rng(), rB = rng();
      const app = APP_OF[k];
      const tn = (app === 'r' || app === 'w') ? 0 : Math.min(2, Math.floor(rA * 3));
      let lv = k === 'w' ? 0 : 1;
      const edge = NB.some((d) => kindAt(x + d[0], y + d[1]) === '.');
      if (k === 'g' && edge && !blocked.has(x + ',' + y) && rB < .3) lv = 0;
      const id = tileSym(app, tn, lv);
      let focus = '';
      if (k === '3') {
        let d = '';
        const seg = (a, b, c, e) => { d += `M${pt(a, b, lv)}L${pt(c, e, lv)}`; };
        if (kindAt(x - 1, y) !== '3') seg(x, y, x, y + 1);
        if (kindAt(x + 1, y) !== '3') seg(x + 1, y, x + 1, y + 1);
        if (kindAt(x, y - 1) !== '3') seg(x, y, x + 1, y);
        if (kindAt(x, y + 1) !== '3') seg(x, y + 1, x + 1, y + 1);
        if (d) focus = `<path class="focus" d="${d}"/>`;
      }
      const o = P(x, y, 0);
      growCell(x, y, lv); growCell(x, y, lv - 1);
      ground.push({ key: x + y + 1, id: uid++, html: `<g class="t" style="--d:${(x + y) * 12}"><use href="#${id}" x="${n2(o.sx)}" y="${n2(o.sy)}"/>${focus}</g>` });
    }
  }
  ground.sort((a, b) => a.key - b.key || a.id - b.id);

  /* ---------- Entidades estáticas (rank 1) ---------- */
  const objects = [];
  const addObj = (gx, gy, z, inner, top) => {
    growCell(gx, gy, top);
    objects.push({ key: gx + gy + 1, rank: 1, z, id: uid++, html: `<g class="e" style="--d:${(gx + gy) * 12}">${inner}</g>` });
  };

  /* Árvores: dois símbolos, instanciados com <use> */
  const TRUNK = tone('#6B4F3A'), G1 = tone('#4F7A45'), G2 = tone('#5F8A4E');
  syms.set('tree0', `<g id="tree0">${box(.43, .43, 0, .57, .57, .3, TRUNK, { noTop: true })}${pyr(.12, .12, .88, .88, .22, .85, G1)}${pyr(.22, .22, .78, .78, .62, 1.4, G2)}</g>`);
  syms.set('tree1', `<g id="tree1">${box(.43, .43, 0, .57, .57, .36, TRUNK, { noTop: true })}${box(.2, .2, .32, .8, .8, 1.0, G2)}</g>`);
  TREES.forEach(([gx, gy], i) => {
    const o = P(gx, gy, 0);
    addObj(gx, gy, 1, `<use href="#tree${i % 2}" x="${n2(o.sx)}" y="${n2(o.sy - CH)}"/>`, 2.5);
  });

  /* Galpão de máquinas: seis módulos 1x1 */
  const ROOF = '#244B3D', WALL = '#F1EFE8';
  const WALLS = { t: ROOF, l: WALL, r: '#D9D6CC' };
  GALPAO.forEach(([gx, gy]) => {
    let s = box(gx, gy, 1, gx + 1, gy + 1, 3.2, WALLS);
    if (gy === 7) s += gx === 2 ? winL(gx + .3, gx + .7, gy + 1, 1, 1.8, '#244B3D') : winL(gx + .22, gx + .78, gy + 1, 1.95, 2.65, '#2F5546');
    if (gx === 3) s += winR(gy + .22, gy + .78, gx + 1, 1.95, 2.65, '#1B3A2F');
    addObj(gx, gy, 1, s, 3.3);
  });

  /* Silo */
  {
    const [gx, gy] = SILO, cx = gx + .5, cy = gy + .5;
    const body = { t: WALL, l: '#ECEAE0', r: '#CFCDC2' };
    const s = oct(cx, cy, .36, 1, 3.9, body) + oct(cx, cy, .375, 2.3, 2.5, { t: '#416B56', l: '#416B56', r: '#2F5546' }, true) + oct(cx, cy, .3, 3.9, 4.2, { t: ROOF, l: '#3A6A55', r: '#1B3A2F' });
    addObj(gx, gy, 1, s, 4.3);
  }
  /* Caixa d'água elevada */
  {
    const [gx, gy] = TORRE, cx = gx + .5, cy = gy + .5, d = .26, w = .035, LEG = tone('#6B746E');
    let s = '';
    [[-d, -d], [d, -d], [-d, d], [d, d]].forEach(([dx, dy]) => { s += box(cx + dx - w, cy + dy - w, 1, cx + dx + w, cy + dy + w, 2.2, LEG, { noTop: true }); });
    s += oct(cx, cy, .34, 2.2, 2.95, { t: WALL, l: '#E6E3D8', r: '#C4C2B7' }) + oct(cx, cy, .28, 2.95, 3.12, { t: ROOF, l: '#3A6A55', r: '#1B3A2F' });
    addObj(gx, gy, 1, s, 3.2);
  }
  /* Casa pequena */
  {
    const [gx, gy] = CASA;
    let s = box(gx + .14, gy + .14, 1, gx + .86, gy + .86, 1.9, { t: WALL, l: WALL, r: '#D9D6CC' }, { noTop: true });
    s += winL(gx + .22, gx + .4, gy + .86, 1.3, 1.65, '#244B3D') + winL(gx + .5, gx + .72, gy + .86, 1, 1.55, DIRT_L) + winR(gy + .4, gy + .6, gx + .86, 1.3, 1.65, '#1B3A2F');
    s += pyr(gx + .04, gy + .04, gx + .96, gy + .96, 1.9, 2.4, tone('#B5543A'), true);
    addObj(gx, gy, 1, s, 2.5);
  }
  /* Postes de sensor: o anel pulsa uma única vez ao aparecer */
  SENSORS.forEach(([gx, gy]) => {
    const cx = gx + .5, cy = gy + .5, top = P(cx, cy, 2.15), foot = P(cx, cy, 1);
    const s = `<ellipse class="ring" cx="${n2(foot.sx)}" cy="${n2(foot.sy)}" rx="24" ry="12"/>` + box(cx - .03, cy - .03, 1, cx + .03, cy + .03, 2.1, tone('#244B3D')) +
      `<circle cx="${n2(top.sx)}" cy="${n2(top.sy)}" r="3.6" fill="#FAFAF7" stroke="#244B3D" stroke-width="1.4"/>`;
    addObj(gx, gy, 1, s, 2.4);
  });
  objects.sort((a, b) => a.key - b.key || a.rank - b.rank || a.z - b.z || a.id - b.id);
  const okeys = objects.map((o) => o.key);

  /* ---------- Máquinas (rank 2) ---------- */
  const BODY = tone('#FAFAF7', .9, .76), CAB = tone('#244B3D'), DARK = tone('#2A332E', .9, .75), GOLDC = tone('#D9C58A');
  const SPR = {
    trator: [
      { a: [-.34, -.10], b: [.16, .27], z: [0, .3], c: DARK, nt: 1 }, { a: [-.34, -.10], b: [-.27, -.16], z: [0, .3], c: DARK, nt: 1 },
      { a: [.12, .28], b: [.16, .25], z: [0, .2], c: DARK, nt: 1 }, { a: [.12, .28], b: [-.25, -.16], z: [0, .2], c: DARK, nt: 1 },
      { a: [-.30, .36], b: [-.16, .16], z: [.1, .34], c: BODY }, { a: [-.28, 0], b: [-.14, .14], z: [.34, .64], c: CAB }
    ],
    colhedora: [
      { a: [-.2, 0], b: [.2, .28], z: [0, .22], c: DARK, nt: 1 }, { a: [-.2, 0], b: [-.28, -.2], z: [0, .22], c: DARK, nt: 1 },
      { a: [-.3, .18], b: [-.2, .2], z: [.1, .4], c: BODY }, { a: [0, .18], b: [-.14, .14], z: [.4, .66], c: CAB },
      { a: [.18, .3], b: [-.38, .38], z: [.08, .22], c: GOLDC }
    ],
    pulverizador: [
      { a: [-.22, -.08], b: [.1, .17], z: [0, .2], c: DARK, nt: 1 }, { a: [-.22, -.08], b: [-.17, -.1], z: [0, .2], c: DARK, nt: 1 },
      { a: [.06, .2], b: [.1, .17], z: [0, .2], c: DARK, nt: 1 }, { a: [.06, .2], b: [-.17, -.1], z: [0, .2], c: DARK, nt: 1 },
      { a: [-.3, .2], b: [-.1, .1], z: [.12, .34], c: BODY }, { a: [.02, .2], b: [-.09, .09], z: [.34, .58], c: CAB },
      { a: [-.32, -.24], b: [-.38, .38], z: [.28, .34], c: BODY }
    ]
  };
  const ORI = { px: (a, b) => [a, b], mx: (a, b) => [-a, -b], py: (a, b) => [b, a], my: (a, b) => [-b, -a] };
  function sprite(name, dir) {
    const m = ORI[dir];
    const parts = SPR[name].map((p) => {
      const A = m(p.a[0], p.b[0]), B = m(p.a[1], p.b[1]);
      const x0 = Math.min(A[0], B[0]), x1 = Math.max(A[0], B[0]), y0 = Math.min(A[1], B[1]), y1 = Math.max(A[1], B[1]);
      return { x0, x1, y0, y1, z0: p.z[0], z1: p.z[1], c: p.c, nt: p.nt, k: x0 + x1 + y0 + y1 };
    }).sort((u, v) => u.k - v.k || u.z0 - v.z0);
    return `<g id="spr-${name}-${dir}">${parts.map((p) => box(p.x0, p.y0, p.z0, p.x1, p.y1, p.z1, p.c, { noTop: !!p.nt })).join('')}</g>`;
  }
  Object.keys(SPR).forEach((n) => Object.keys(ORI).forEach((d) => syms.set(`spr-${n}-${d}`, sprite(n, d))));

  const SPECS = [
    { name: 'trator', v: .6, pts: [[3.5, 1.5], [6.5, 1.5], [6.5, 2.5], [3.5, 2.5], [3.5, 3.5], [6.5, 3.5]] },
    { name: 'colhedora', v: .45, pts: [[9.5, 6.5], [12.5, 6.5], [12.5, 7.5], [9.5, 7.5], [9.5, 8.5], [12.5, 8.5]] },
    { name: 'pulverizador', v: .9, pts: [[1.5, 5.5], [13.5, 5.5]] }
  ];
  const machines = SPECS.map((sp) => {
    const cum = [0];
    for (let i = 1; i < sp.pts.length; i++) cum.push(cum[i - 1] + Math.abs(sp.pts[i][0] - sp.pts[i - 1][0]) + Math.abs(sp.pts[i][1] - sp.pts[i - 1][1]));
    return { name: sp.name, v: sp.v, pts: sp.pts, cum, L: cum[cum.length - 1], s: 0, dir: 1, hold: 0, head: '', idx: -1, key: 0, px: 0, py: 0, near: false, node: null, use: null };
  });
  /* Todas as trilhas são ortogonais; este laço só protege contra uma edição que quebre isso */
  machines.forEach((m) => m.pts.forEach((p, i) => { if (i && p[0] !== m.pts[i - 1][0] && p[1] !== m.pts[i - 1][1]) console.error('[AgroScene] trilha diagonal em', m.name); }));

  const R_HALO = 30;
  const machineHtml = (m, i) => `<g class="m" id="agM${i}"><ellipse class="halo" rx="${R_HALO}" ry="${R_HALO / 2}"/><ellipse class="sh" rx="15.8" ry="7.9"/><use href="#spr-${m.name}-px"/></g>`;

  /* Drone: sempre na camada mais alta, fora da lista ordenada */
  const DRONE = { cx: 10.5, cy: 3, ax: 2.2, ay: 1.1, z: 5, T: 24000 };
  grow(DRONE.cx - DRONE.ax, DRONE.cy - DRONE.ay, 6); grow(DRONE.cx + DRONE.ax, DRONE.cy + DRONE.ay, 6);
  const droneHtml = `<g class="dr"><g id="agDrS"><ellipse class="sh" rx="13.5" ry="6.8"/></g><g id="agDr">` +
    `<path d="M-9.6 -4.8L9.6 4.8M9.6 -4.8L-9.6 4.8" fill="none" stroke="#244B3D" stroke-width="1.6" stroke-linecap="round"/>` +
    [[-9.6, -4.8], [9.6, -4.8], [-9.6, 4.8], [9.6, 4.8]].map((q) => `<ellipse class="rotor" cx="${q[0]}" cy="${q[1]}" rx="5" ry="2.4"/>`).join('') +
    `<ellipse rx="5" ry="3.2" fill="#FAFAF7" stroke="#244B3D" stroke-width="1.2"/></g></g>`;

  /* ---------- Montagem do SVG ---------- */
  const vb = { x: bb.x0 - 60, y: bb.y0 - 120, w: bb.x1 - bb.x0 + 120, h: bb.y1 - bb.y0 + 180 };
  const cxI = (bb.x0 + bb.x1) / 2, cyI = P(8, 6, -1).sy + 30, rxI = (bb.x1 - bb.x0) * .52;
  const svgHtml = `<svg class="ag-svg" viewBox="${n2(vb.x)} ${n2(vb.y)} ${n2(vb.w)} ${n2(vb.h)}" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">` +
    `<defs><radialGradient id="agSombra"><stop offset="0" stop-color="#18231E" stop-opacity=".18"/><stop offset="1" stop-color="#18231E" stop-opacity="0"/></radialGradient>${[...syms.values()].join('')}</defs>` +
    `<ellipse cx="${n2(cxI)}" cy="${n2(cyI)}" rx="${n2(rxI)}" ry="${n2(rxI * .36)}" fill="url(#agSombra)"/>` +
    `<g id="agGround">${ground.map((t) => t.html).join('')}</g>` +
    `<g id="agObjects">${objects.map((o) => o.html).join('')}${machines.map(machineHtml).join('')}</g>` +
    `<g id="agTop">${droneHtml}</g></svg>`;
  host.innerHTML = svgHtml;

  const svg = host.firstElementChild;
  const world = svg.querySelector('#agObjects');
  const statNodes = [...world.children].slice(0, objects.length);
  machines.forEach((m, i) => { m.node = svg.querySelector('#agM' + i); m.use = m.node.querySelector('use'); });
  const droneEl = svg.querySelector('#agDr'), droneSh = svg.querySelector('#agDrS');

  /* ---------- Posicionamento dos indicadores ---------- */
  const pins = [...document.querySelectorAll('.ag-pin[data-gx]')];
  pins.forEach((p) => { p.dataset.h = parseFloat(p.style.getPropertyValue('--h')) || 60; });
  let S = 1, OX = 0, OY = 0;
  function layout() {
    const Wd = visual.clientWidth, Hd = visual.clientHeight;
    if (!Wd || !Hd) return;
    S = Math.min(Wd / vb.w, Hd / vb.h);
    OX = (Wd - vb.w * S) / 2 - vb.x * S; OY = (Hd - vb.h * S) / 2 - vb.y * S;
    const placed = [];
    pins.forEach((p) => {
      const q = P(+p.dataset.gx, +p.dataset.gy, +p.dataset.gz), x = q.sx * S + OX, y = q.sy * S + OY;
      const lab = p.querySelector('.ag-pin__label'), lw = lab.offsetWidth, lh = lab.offsetHeight;
      let h = +p.dataset.h;
      let shift = 0;
      if (x - lw / 2 < 12) shift = 12 - (x - lw / 2);
      else if (x + lw / 2 > Wd - 12) shift = Wd - 12 - (x + lw / 2);
      const l = x - lw / 2 + shift;
      /* Se o rótulo encostar em outro já posicionado, sobe a haste; se não couber, mantém a altura original */
      const hit = (hh) => placed.some((r) => l < r.r + 8 && l + lw > r.l - 8 && y - hh - lh < r.b + 8 && y - hh > r.t - 8);
      const h0 = h;
      for (let i = 0; i < 20 && hit(h) && y - (h + 12) - lh >= 12; i++) h += 12;
      if (hit(h)) h = h0;
      if (y - h - lh < 12) h = Math.max(20, y - lh - 12);
      placed.push({ l, r: l + lw, t: y - h - lh, b: y - h });
      p.style.setProperty('--x', n2(x) + 'px'); p.style.setProperty('--y', n2(y) + 'px');
      p.style.setProperty('--h', n2(h) + 'px'); p.style.setProperty('--lx', n2(shift) + 'px');
    });
  }
  new ResizeObserver(layout).observe(visual);

  /* ---------- Movimento ---------- */
  const ub = (k) => { let lo = 0, hi = okeys.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (okeys[mid] <= k) lo = mid + 1; else hi = mid; } return lo; };

  function locate(m) {
    let i = 0;
    while (i < m.pts.length - 2 && m.s > m.cum[i + 1]) i++;
    const a = m.pts[i], b = m.pts[i + 1], len = m.cum[i + 1] - m.cum[i], t = len ? (m.s - m.cum[i]) / len : 0;
    const ux = Math.sign(b[0] - a[0]) * m.dir, uy = Math.sign(b[1] - a[1]) * m.dir;
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, head: ux > 0 ? 'px' : ux < 0 ? 'mx' : uy > 0 ? 'py' : 'my' };
  }
  /* Só mexe no DOM quando a máquina cruza para outra posição na lista; nunca a cada frame */
  function reorder() {
    machines.slice().sort((a, b) => a.idx - b.idx || a.key - b.key).forEach((m) => world.insertBefore(m.node, statNodes[m.idx] || null));
  }
  function pose(m) {
    const q = locate(m), p = P(q.x, q.y, 1);
    m.px = p.sx; m.py = p.sy; m.key = q.x + q.y;
    m.node.setAttribute('transform', `translate(${n2(p.sx)} ${n2(p.sy)})`);
    if (q.head !== m.head) { m.head = q.head; m.use.setAttribute('href', `#spr-${m.name}-${q.head}`); }
    const i = ub(m.key);
    if (i !== m.idx) { m.idx = i; return true; }
    return false;
  }
  function poseAll() {
    let moved = false;
    machines.forEach((m) => { if (pose(m)) moved = true; });
    if (moved) reorder();
  }
  function advance(m, dt) {
    if (m.hold > 0) {
      m.hold -= dt;
      if (m.hold > 0) return;
      m.dir = -m.dir; dt = -m.hold; m.hold = 0;
    }
    m.s += m.dir * m.v * dt / 1000;
    if (m.s >= m.L) { m.s = m.L; m.hold = 600; } else if (m.s <= 0) { m.s = 0; m.hold = 600; }
  }
  function flyDrone(t) {
    const th = 2 * Math.PI * t / DRONE.T, x = DRONE.cx + DRONE.ax * Math.sin(th), y = DRONE.cy + DRONE.ay * Math.sin(2 * th);
    const a = P(x, y, DRONE.z), g = P(x, y, 1);
    droneEl.setAttribute('transform', `translate(${n2(a.sx)} ${n2(a.sy)})`);
    droneSh.setAttribute('transform', `translate(${n2(g.sx)} ${n2(g.sy)})`);
  }

  const START = 1400; /* a simulação só começa depois da entrada das máquinas */
  let sim = 0, last = 0, raf = 0, running = false, started = false, inView = true;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(50, now - last) : 16;
    last = now; sim += dt;
    if (sim < START) return;
    let moved = false;
    machines.forEach((m) => { advance(m, dt); if (pose(m)) moved = true; });
    if (moved) reorder();
    flyDrone(sim - START);
  }
  function sync() {
    const should = started && !reduce && inView && !document.hidden;
    if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver((e) => { inView = e[e.length - 1].isIntersecting; sync(); }).observe(visual);

  /* Pose inicial (também é a cena final com movimento reduzido) */
  poseAll(); flyDrone(0);

  /* Halo das máquinas: um pouco mais visível quando o cursor se aproxima */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let busy = false;
    visual.addEventListener('pointermove', (e) => {
      if (busy) return; busy = true;
      requestAnimationFrame(() => {
        busy = false;
        const r = visual.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        machines.forEach((m) => {
          const dx = m.px * S + OX - mx, dy = m.py * S + OY - my, near = dx * dx + dy * dy < 90 * 90;
          if (near !== m.near) { m.near = near; m.node.classList.toggle('is-near', near); }
        });
      });
    });
    visual.addEventListener('pointerleave', () => machines.forEach((m) => { m.near = false; m.node.classList.remove('is-near'); }));
  }

  /* ---------- Verificações (só com ?debug) ---------- */
  if (DEBUG) {
    machines.forEach((m) => {
      for (let s = 0; s <= m.L * 20; s++) {
        const keep = m.s; m.s = Math.min(m.L, s / 20);
        const q = locate(m); m.s = keep;
        const cx = Math.floor(q.x), cy = Math.floor(q.y);
        if (blocked.has(cx + ',' + cy) || kindAt(cx, cy) === '.') { console.error('[AgroScene] trilha de', m.name, 'cruza a célula ocupada', cx + ',' + cy); break; }
      }
    });
    console.log('[AgroScene] nós SVG:', svg.querySelectorAll('*').length);
    window.AgroScene = { run: run, _dbg: { machines, blocked, okeys, statNodes, world, vb, get scale() { return S; } } };
  }

  function run() {
    if (started) return;
    started = true;
    layout();
    sync();
  }
  if (!window.AgroScene) window.AgroScene = { run };
  /* Se login.js já iniciou a coreografia antes deste script carregar, começa agora */
  if (root.classList.contains('ag-ready')) run();
})();
