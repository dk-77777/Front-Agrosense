const { createApp } = Vue;
const loggedUser = window.AgroSenseAuth.session();
const userLabel = { operador: 'Operador', tecnico: 'Técnico', gestor: 'Gestor' };
const visibleMenus = {
  operador: ['Dashboard', 'Máquinas'],
  tecnico: ['Dashboard', 'Máquinas', 'Relatórios'],
  gestor: ['Dashboard', 'Máquinas', 'Cadastro', 'Relatórios']
};

// O visualizador 3D fica fora do estado do Vue para não virar objeto reativo.
let viewer = null;
let timer = null;
let toastSequence = 0;
const toastTimers = new Map();
let returnFocusAfterDialog = null;

// Microinteração curta: apenas quando um indicador de fato muda de valor.
const numberPop = {
  updated(el, binding) {
    if (binding.value === binding.oldValue || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.getAnimations().forEach(animation => animation.cancel());
    el.animate([{ opacity: .65, transform: 'translateY(2px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'cubic-bezier(.2,0,0,1)' });
  }
};
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cadastro salvo no navegador (se existir) ou dados de exemplo.
const saved = AgroData.load();
const initialSectors = saved
  ? saved.sectors
  : AgroData.DEFAULT_SECTORS.map(s => Object.assign({}, s));
const initialMachines = AgroData.createMachines(saved ? saved.machines : null);

const CHART_META = {
  temp: { label: 'Temperatura', unit: '°C', digits: 1, span: 6, step: 5 },
  rpm: { label: 'Rotação', unit: 'rpm', digits: 0, span: 300, step: 100 },
  pressao: { label: 'Pressão do óleo', unit: 'bar', digits: 2, span: 1, step: 0.5 }
};

function emptyForm(category, setor) {
  return {
    category: category || 'colheitadeira',
    id: '', name: '', modelo: '',
    setor: setor || '',
    ano: '', horas: '', ultima: '', proxima: '',
    behavior: 'normal'
  };
}

const app = createApp({
  data() {
    return {
      activeMenu: 'Início',
      currentUser: loggedUser || { nome: 'Visitante', perfil: 'operador' },
      menu: [
        { label: 'Início', icon: '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/></svg>' },
        { label: 'Dashboard', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
        { label: 'Máquinas', icon: '<svg viewBox="0 0 24 24"><circle cx="7" cy="16.5" r="3.5"/><circle cx="18" cy="17.5" r="2.2"/><path d="M3.5 13V7h6l2 5h6.5M13 7h3l1.5 5"/></svg>' },
        { label: 'Cadastro', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>' },
        { label: 'Relatórios', icon: '<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg>' }
      ].filter(item => item.label === 'Início' || (visibleMenus[loggedUser?.perfil] || []).includes(item.label)),
      search: '',
      showSearch: false,
      notice: false,
      profileOpen: false,
      seenAlerts: {},
      toasts: [],
      confirmDialog: null,

      machines: initialMachines,
      sectors: initialSectors,

      // Máquinas
      machineTab: 'Todas',
      machineTabs: ['Todas', 'Colheitadeiras', 'Tratores'],
      openId: null,
      autoRotate: !reducedMotion,

      // Dashboard
      chartKey: 'temp',
      alertFilter: 'all',
      selectedSector: '',
      expandedAlerts: {},
      telemetryScope: 'all',
      telemetryOnlyAlerts: false,
      chartTabs: Object.keys(CHART_META).map(k => ({ key: k, label: CHART_META[k].label })),

      // Cadastro
      cadTab: 'Máquina',
      categories: AgroData.CATEGORIES,
      behaviors: AgroData.BEHAVIORS,
      form: emptyForm('colheitadeira', initialSectors.length ? initialSectors[0].nome : ''),
      formError: '',
      formOk: '',
      lastAdded: null,
      sectorForm: { nome: '', descricao: '', hectares: '' },
      sectorError: '',
      sectorOk: '',

      // Relatório
      events: [],
      sessionStart: Date.now(),
      now: Date.now(),
      reportSetor: 'Todos',
      reportCategoria: 'Todas'
    };
  },
  computed: {
    userProfileLabel() { return userLabel[this.currentUser.perfil] || 'Visitante'; },
    userInitials() { return this.currentUser.nome.slice(0, 2).toUpperCase(); },
    evaluations() {
      const out = {};
      this.machines.forEach(m => { out[m.id] = AgroData.evaluate(m); });
      return out;
    },
    counts() {
      const c = { total: this.machines.length, ok: 0, warn: 0, crit: 0 };
      this.machines.forEach(m => { c[this.evaluations[m.id].status] += 1; });
      return c;
    },
    alertCount() {
      return this.counts.warn + this.counts.crit;
    },
    unreadAlerts() {
      return this.attentionList.filter(row => !this.isAlertRead(row)).length;
    },
    confirmTitle() {
      if (!this.confirmDialog) return '';
      if (this.confirmDialog.type === 'machine') return 'Remover máquina?';
      if (this.confirmDialog.type === 'sector') return 'Remover setor?';
      return 'Restaurar dados de exemplo?';
    },
    confirmMessage() {
      if (!this.confirmDialog) return '';
      if (this.confirmDialog.type === 'machine') return 'O cadastro da máquina ' + this.confirmDialog.value + ' será removido.';
      if (this.confirmDialog.type === 'sector') return 'O setor ' + this.confirmDialog.value + ' será removido.';
      return 'Suas máquinas e setores cadastrados serão apagados e substituídos pelos dados de exemplo.';
    },
    confirmLabel() {
      return this.confirmDialog && this.confirmDialog.type === 'restore' ? 'Restaurar' : 'Remover';
    },
    currentMachine() {
      return this.machines.find(m => m.id === this.openId) || null;
    },
    pageSubtitle() {
      const c = this.counts;
      if (this.activeMenu === 'Dashboard') {
        return c.total + ' máquinas em ' + this.sectors.length + ' setores, ' + this.alertCount + ' com alerta';
      }
      if (this.activeMenu === 'Máquinas') return c.total + ' máquinas, ' + this.alertCount + ' com alerta';
      if (this.activeMenu === 'Cadastro') return 'Adicione máquinas e setores';
      return 'Imprima o resumo das simulações';
    },
    // Dashboard
    attentionList() {
      return this.machines
        .map(m => ({ m: m, ev: this.evaluations[m.id] }))
        .filter(r => r.ev.status !== 'ok')
        .sort((a, b) => (b.ev.status === 'crit') - (a.ev.status === 'crit') || a.m.id.localeCompare(b.m.id));
    },
    filteredAttention() {
      return this.alertFilter === 'all' ? this.attentionList : this.attentionList.filter(r => r.ev.status === this.alertFilter);
    },
    fleetMix() {
      const n = c => this.machines.filter(m => m.category === c).length;
      const parts = [];
      if (n('trator')) parts.push(n('trator') + (n('trator') === 1 ? ' trator' : ' tratores'));
      if (n('colheitadeira')) parts.push(n('colheitadeira') + (n('colheitadeira') === 1 ? ' colheitadeira' : ' colheitadeiras'));
      return parts.join(' · ');
    },
    sectorMachines() {
      return this.machines.filter(m => m.setor === this.selectedSector)
        .map(m => ({ m: m, ev: this.evaluations[m.id] }))
        .sort((a, b) => b.ev.issues.length - a.ev.issues.length || a.m.id.localeCompare(b.m.id));
    },
    sectorRows() {
      return this.sectors.map(s => {
        const items = this.machines.filter(m => m.setor === s.nome);
        const row = { s: s, total: items.length, ok: 0, warn: 0, crit: 0 };
        items.forEach(m => { row[this.evaluations[m.id].status] += 1; });
        row.pct = {
          ok: row.total ? (row.ok / row.total) * 100 : 0,
          warn: row.total ? (row.warn / row.total) * 100 : 0,
          crit: row.total ? (row.crit / row.total) * 100 : 0
        };
        return row;
      });
    },
    fleetSplit() {
      const n = c => this.machines.filter(m => m.category === c).length;
      return [
        { label: 'Tratores', value: n('trator') },
        { label: 'Colheitadeiras', value: n('colheitadeira') },
        { label: 'Setores', value: this.sectors.length }
      ];
    },
    okShare() { return this.counts.total ? Math.round((this.counts.ok / this.counts.total) * 100) : 0; },
    issueTotals() {
      const t = { warn: 0, crit: 0 };
      this.machines.forEach(m => this.evaluations[m.id].issues.forEach(i => { if (i.level === 2) t.crit += 1; else t.warn += 1; }));
      return t;
    },
    alertRows() {
      return this.filteredAttention.map(r => ({
        m: r.m, ev: r.ev,
        views: r.ev.issues.slice().sort((a, b) => b.level - a.level).map(i => this.issueView(r.m, i))
      }));
    },
    telemetryScopes() {
      const cats = AgroData.CATEGORIES.filter(c => this.machines.some(m => m.category === c.key))
        .map(c => ({ value: 'cat:' + c.key, label: c.label + ' (' + this.machines.filter(m => m.category === c.key).length + ')' }));
      const ms = this.machines.map(m => ({ value: 'm:' + m.id, label: m.id + ' · ' + m.name + ' · ' + m.setor }));
      return [{ value: 'all', label: 'Toda a frota (' + this.machines.length + ')' }].concat(cats, ms);
    },
    telemetry() {
      const key = this.chartKey, meta = CHART_META[key], sc = this.telemetryScope;
      let list = this.machines;
      if (sc.indexOf('cat:') === 0) list = list.filter(m => m.category === sc.slice(4));
      else if (sc.indexOf('m:') === 0) list = list.filter(m => m.id === sc.slice(2));
      const level = m => this.evaluations[m.id].levels[key];
      const scopeTotal = list.length;
      const outCount = list.filter(m => level(m) > 0).length;
      if (this.telemetryOnlyAlerts) list = list.filter(m => level(m) > 0);
      const usable = list.filter(m => m.history && m.history[key] && m.history[key].length > 1);
      const series = usable.map(m => ({ id: m.id, name: m.name, level: level(m), values: m.history[key].slice(), now: m[key] }));
      const cats = Array.from(new Set(usable.map(m => m.category)));
      let limits = [];
      if (cats.length === 1) {
        const L = AgroData.LIMITS[cats[0]][key];
        if (key === 'rpm') limits = [
          { v: L.critHi, label: 'Crítico acima de', level: 2 }, { v: L.hi, label: 'Atenção acima de', level: 1 },
          { v: L.lo, label: 'Atenção abaixo de', level: 1 }, { v: L.critLo, label: 'Crítico abaixo de', level: 2 }];
        else if (key === 'temp') limits = [{ v: L.crit, label: 'Crítico a partir de', level: 2 }, { v: L.warn, label: 'Atenção acima de', level: 1 }];
        else limits = [{ v: L.warn, label: 'Atenção abaixo de', level: 1 }, { v: L.crit, label: 'Crítico até', level: 2 }];
      }
      let emptyText = '';
      if (!series.length) {
        if (!scopeTotal) emptyText = 'Nenhuma máquina neste escopo.';
        else if (this.telemetryOnlyAlerts && !outCount) emptyText = 'Nenhuma máquina fora do limite neste sensor.';
        else emptyText = 'Histórico insuficiente: aguarde as próximas leituras.';
      }
      return { meta: meta, series: series, limits: limits, scopeTotal: scopeTotal, outCount: outCount, emptyText: emptyText, limitHint: cats.length > 1 };
    },
    chartMeta() { return CHART_META[this.chartKey]; },
    chart() {
      return AgroData.fleetChart(this.machines, this.chartKey, CHART_META[this.chartKey].span);
    },

    // Máquinas
    groupedMachines() {
      const term = this.search.trim().toLowerCase();
      return AgroData.CATEGORIES
        .filter(c => this.machineTab === 'Todas' || this.machineTab === c.label)
        .map(c => ({
          key: c.key,
          label: c.label,
          items: this.machines.filter(m => m.category === c.key &&
            (!term || [m.id, m.name, m.modelo, m.setor].join(' ').toLowerCase().includes(term)))
        }))
        .filter(g => g.items.length);
    },

    // Cadastro
    suggestedId() { return AgroData.nextId(this.machines, this.form.category); },
    suggestedName() { return AgroData.DEFAULT_NAME[this.form.category]; },
    sectorCounts() {
      const out = {};
      this.sectors.forEach(s => { out[s.nome] = 0; });
      this.machines.forEach(m => { out[m.setor] = (out[m.setor] || 0) + 1; });
      return out;
    },

    // Relatório
    reportRows() {
      return this.machines
        .filter(m => (this.reportSetor === 'Todos' || m.setor === this.reportSetor) &&
                     (this.reportCategoria === 'Todas' || m.category === this.reportCategoria))
        .map(m => ({ m: m, ev: this.evaluations[m.id], sum: AgroData.summary(m) }));
    },
    reportCounts() {
      const c = { ok: 0, warn: 0, crit: 0 };
      this.reportRows.forEach(r => { c[r.ev.status] += 1; });
      return c;
    },
    reportReadings() {
      return this.reportRows.reduce((max, r) => Math.max(max, r.sum ? r.sum.n : 0), 0);
    },
    reportIssues() {
      const out = [];
      this.reportRows.forEach(r => r.ev.issues.forEach(i => out.push({ id: r.m.id, setor: r.m.setor, issue: i })));
      return out.sort((a, b) => b.issue.level - a.issue.level);
    },
    reportEvents() {
      const ids = this.reportRows.map(r => r.m.id);
      return this.events.filter(e => ids.indexOf(e.id) !== -1).slice(0, 30);
    },
    reportFilter() {
      const cat = this.reportCategoria === 'Todas' ? 'Todas'
        : (this.reportCategoria === 'trator' ? 'Tratores' : 'Colheitadeiras');
      return 'Setor: ' + this.reportSetor + '. Categoria: ' + cat + '.';
    }
  },
  watch: {
    activeMenu(menu) {
      if (history.state?.agroMenu !== menu) {
        history.pushState({ ...history.state, agroMenu: menu }, '');
      }
      this.notice = false;
      this.profileOpen = false;
      this.showSearch = false;
      if (menu !== 'Máquinas') this.backToList();
    },
    sectors: { deep: true, handler() { this.persist(); } }
  },
  mounted() {
    history.replaceState({ ...history.state, agroMenu: this.activeMenu }, '');
    window.addEventListener('popstate', this.restoreMenu);
    // Máquinas que já começam fora do normal entram no registro de alertas.
    this.machines.forEach(m => {
      const ev = this.evaluations[m.id];
      if (ev.status !== 'ok') this.pushEvent(m, ev, 'Início do registro. ');
    });
    timer = setInterval(() => this.tick(), 2000);
    document.addEventListener('pointerdown', this.onOutsidePointer);
    document.addEventListener('keydown', this.onGlobalKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('popstate', this.restoreMenu);
    clearInterval(timer);
    toastTimers.forEach(timeout => clearTimeout(timeout));
    toastTimers.clear();
    document.removeEventListener('pointerdown', this.onOutsidePointer);
    document.removeEventListener('keydown', this.onGlobalKeydown);
    this.destroyViewer();
  },
  methods: {
    logout() { window.AgroSenseAuth.logout(); },
    fmt: AgroData.fmt,
    readings(m) { return AgroData.readings(m); },
    fmtDateTime(ts) { return new Date(ts).toLocaleString('pt-BR'); },
    fmtTime(ts) { return new Date(ts).toLocaleTimeString('pt-BR'); },
    duration(ms) {
      const s = Math.max(0, Math.round(ms / 1000));
      if (s < 60) return s + ' s';
      const m = Math.floor(s / 60);
      if (m < 60) return m + ' min ' + (s % 60) + ' s';
      return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
    },
    pct(v) { return AgroData.fmt(v, 0) + '%'; },

    // Menus e avisos usam apenas os dados simulados já existentes.
    alertKey(row) {
      return row.m.id + '|' + row.ev.status + '|' + row.ev.issues.map(issue => issue.key).join(',');
    },
    isAlertRead(row) { return !!this.seenAlerts[this.alertKey(row)]; },
    markAllAlertsRead() {
      this.attentionList.forEach(row => { this.seenAlerts[this.alertKey(row)] = true; });
    },
    openAlert(row) {
      this.seenAlerts[this.alertKey(row)] = true;
      this.notice = false;
      this.openMachineById(row.m.id);
    },
    toggleNotice() {
      this.profileOpen = false;
      this.notice = !this.notice;
    },
    toggleProfile() {
      this.notice = false;
      this.profileOpen = !this.profileOpen;
    },
    toggleSearch() {
      this.showSearch = !this.showSearch;
      if (this.showSearch) this.$nextTick(() => this.$refs.searchInput && this.$refs.searchInput.focus());
    },
    onOutsidePointer(e) {
      if (this.notice && this.$refs.notificationArea && !this.$refs.notificationArea.contains(e.target)) this.notice = false;
      if (this.profileOpen && this.$refs.profileArea && !this.$refs.profileArea.contains(e.target)) this.profileOpen = false;
    },
    onGlobalKeydown(e) {
      if (e.key !== 'Escape') return;
      if (this.confirmDialog) { e.preventDefault(); this.dismissConfirm(); return; }
      this.notice = false;
      this.profileOpen = false;
      this.showSearch = false;
    },
    showToast(text, kind = 'success') {
      if (this.toasts.some(toast => toast.text === text && toast.kind === kind)) return;
      const id = ++toastSequence;
      this.toasts.push({ id, text, kind });
      if (this.toasts.length > 3) this.closeToast(this.toasts[0].id);
      if (kind !== 'error') toastTimers.set(id, setTimeout(() => this.closeToast(id), 4400));
    },
    closeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id);
      if (toastTimers.has(id)) { clearTimeout(toastTimers.get(id)); toastTimers.delete(id); }
    },
    requestConfirm(type, value = '') {
      returnFocusAfterDialog = document.activeElement;
      this.notice = false;
      this.profileOpen = false;
      this.confirmDialog = { type, value };
      this.$nextTick(() => this.$refs.cancelConfirmBtn && this.$refs.cancelConfirmBtn.focus());
    },
    dismissConfirm() {
      this.confirmDialog = null;
      this.$nextTick(() => {
        if (returnFocusAfterDialog && returnFocusAfterDialog.isConnected) returnFocusAfterDialog.focus();
        returnFocusAfterDialog = null;
      });
    },
    onDialogKeydown(e) {
      if (e.key !== 'Tab') return;
      const controls = Array.from(e.currentTarget.querySelectorAll('button:not([disabled])'));
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    },
    confirmAction() {
      if (!this.confirmDialog) return;
      const { type, value } = this.confirmDialog;
      this.dismissConfirm();
      if (type === 'machine') {
        if (!this.machines.some(m => m.id === value)) return;
        if (this.openId === value) this.backToList();
        this.machines = this.machines.filter(m => m.id !== value);
        this.events = this.events.filter(e => e.id !== value);
        if (this.lastAdded === value) { this.lastAdded = null; this.formOk = ''; }
        this.persist();
        this.showToast('Máquina ' + value + ' removida.');
      } else if (type === 'sector') {
        if (this.sectorCounts[value] > 0) return;
        this.sectors = this.sectors.filter(s => s.nome !== value);
        if (this.form.setor === value) this.form.setor = this.sectors.length ? this.sectors[0].nome : '';
        if (this.reportSetor === value) this.reportSetor = 'Todos';
        this.showToast('Setor ' + value + ' removido.');
      } else if (type === 'restore') {
        AgroData.clearSaved();
        window.location.reload();
      }
    },

    // Navegação
    goMenu(label) {
      if (!this.menu.some(item => item.label === label)) return;
      if (label === 'Máquinas') this.backToList();
      this.activeMenu = label;
    },
    restoreMenu(event) {
      this.goMenu(event.state?.agroMenu || 'Início');
    },
    goFromHome(label) {
      this.goMenu(label);
      this.$nextTick(() => {
        const target = document.querySelector('.main-panel h1');
        target?.setAttribute('tabindex', '-1');
        target?.focus();
        window.scrollTo(0, 0);
      });
    },
    openHomeAlerts() {
      this.goMenu('Dashboard');
      this.alertFilter = 'all';
      this.$nextTick(() => {
        const heading = document.querySelector('.alerts-panel h2');
        heading?.setAttribute('tabindex', '-1');
        heading?.focus();
        heading?.scrollIntoView({ block: 'start' });
      });
    },
    machineIcon(category) {
      return category === 'colheitadeira'
        ? '<svg viewBox="0 0 28 20" aria-hidden="true"><circle cx="9" cy="15" r="3.4"/><circle cx="22" cy="16" r="2.4"/><path d="M1 5.5h4V14M5 5.5h5.5V3H19v6h5.5v5.5M10.5 3v6.5"/></svg>'
        : '<svg viewBox="0 0 28 20" aria-hidden="true"><circle cx="8" cy="14" r="5"/><circle cx="23" cy="16" r="3"/><path d="M13 12.5h5.5M13 7.5V4h6l2.5 6.5h4V13M3 9h5"/></svg>';
    },
    issueView(m, issue) {
      const lim = AgroData.LIMITS[m.category], f = AgroData.fmt, lvl = issue.level;
      if (issue.key === 'temp') return { key: 'temp', level: lvl, metric: 'Temperatura do motor', value: f(m.temp, 1), unit: '°C', cmp: 'acima de', limit: f(lvl === 2 ? lim.temp.crit : lim.temp.warn, 0) };
      if (issue.key === 'pressao') return { key: 'pressao', level: lvl, metric: 'Pressão do óleo', value: f(m.pressao, 2), unit: 'bar', cmp: 'abaixo de', limit: f(lvl === 2 ? lim.pressao.crit : lim.pressao.warn, 1) };
      const low = m.rpm < lim.rpm.lo;
      return { key: 'rpm', level: lvl, metric: 'Rotação', value: f(m.rpm, 0), unit: 'rpm', cmp: low ? 'abaixo de' : 'acima de', limit: f(low ? (lvl === 2 ? lim.rpm.critLo : lim.rpm.lo) : (lvl === 2 ? lim.rpm.critHi : lim.rpm.hi), 0) };
    },
    pickSector(name) { this.selectedSector = this.selectedSector === name ? '' : name; },
    openMachineById(id) {
      this.activeMenu = 'Máquinas';
      this.showMachine(id);
    },

    // Simulação
    tick() {
      const before = {};
      this.machines.forEach(m => { before[m.id] = this.evaluations[m.id].status; });
      this.machines.forEach(m => AgroData.step(m));
      this.machines.forEach(m => {
        const ev = this.evaluations[m.id];
        if (before[m.id] !== undefined && ev.status !== before[m.id]) {
          this.pushEvent(m, ev, '');
          Object.keys(this.seenAlerts).forEach(key => {
            if (key.startsWith(m.id + '|')) delete this.seenAlerts[key];
          });
        }
      });
      this.now = Date.now();
      if (viewer && this.currentMachine) viewer.setIssues(this.issuesFor(this.currentMachine));
    },
    pushEvent(m, ev, prefix) {
      this.events.unshift({
        time: Date.now(),
        id: m.id,
        setor: m.setor,
        status: ev.status,
        label: ev.label,
        text: prefix + (ev.issues.length
          ? ev.issues.map(i => i.part + ': ' + i.text).join('; ')
          : 'Leituras de volta à faixa normal')
      });
      if (this.events.length > 200) this.events.pop();
    },
    issuesFor(m) {
      return this.evaluations[m.id].issues.map(i => ({ anchor: i.anchor, part: i.part, level: i.level }));
    },
    persist() {
      AgroData.save(this.machines, this.sectors);
    },

    // Máquinas (detalhe e 3D)
    showMachine(id) {
      this.openId = id;
      this.$nextTick(() => this.mountViewer());
    },
    backToList() {
      this.destroyViewer();
      this.openId = null;
    },
    mountViewer() {
      this.destroyViewer();
      const m = this.currentMachine;
      if (!m || !this.$refs.stage) return;
      viewer = new MachineViewer(this.$refs.stage, {
        type: m.category,
        onInspect: () => { this.autoRotate = false; },
        autoRotate: this.autoRotate,
        issues: this.issuesFor(m)
      });
    },
    destroyViewer() {
      if (viewer) { viewer.destroy(); viewer = null; }
    },
    toggleRotate() {
      this.autoRotate = !this.autoRotate;
      if (viewer) viewer.setAutoRotate(this.autoRotate);
    },
    resetView() { if (viewer) viewer.resetView(); },
    focusIssue(issue) { this.autoRotate = false; if (viewer) { viewer.setAutoRotate(false); viewer.focus(issue.anchor); } },

    // Cadastro de máquinas
    addMachine() {
      this.formOk = '';
      const result = AgroData.buildConfig(this.form, this.machines, this.sectors);
      if (result.error) {
        this.formError = result.error;
        return;
      }
      this.formError = '';
      const m = AgroData.hydrate(result.config, this.machines.length);
      this.machines.push(m);
      this.persist();
      this.lastAdded = m.id;
      this.formOk = 'Máquina ' + m.id + ' adicionada ao ' + m.setor + '.';
      this.form = emptyForm(this.form.category, this.form.setor);
    },
    removeMachine(id) { this.requestConfirm('machine', id); },

    // Cadastro de setores
    addSector() {
      this.sectorOk = '';
      const nome = this.sectorForm.nome.trim();
      if (!nome) { this.sectorError = 'Informe o nome do setor.'; return; }
      if (this.sectors.some(s => s.nome.toLowerCase() === nome.toLowerCase())) {
        this.sectorError = 'Já existe um setor chamado ' + nome + '.';
        return;
      }
      const ha = this.sectorForm.hectares === '' ? 0 : Number(this.sectorForm.hectares);
      if (!isFinite(ha) || ha < 0) { this.sectorError = 'A área não pode ser negativa.'; return; }
      this.sectorError = '';
      this.sectors.push({ nome: nome, descricao: this.sectorForm.descricao.trim(), hectares: ha });
      if (!this.form.setor) this.form.setor = nome;
      this.sectorOk = 'Setor ' + nome + ' adicionado.';
      this.sectorForm = { nome: '', descricao: '', hectares: '' };
    },
    removeSector(nome) {
      if (this.sectorCounts[nome] > 0) return;
      this.requestConfirm('sector', nome);
    },
    restoreExamples() { this.requestConfirm('restore'); },

    // Relatório
    printReport() { window.print(); },
    resetRecord() {
      this.machines.forEach(m => AgroData.resetStats(m));
      this.events = [];
      this.sessionStart = Date.now();
      this.showToast('Registro da simulação reiniciado.', 'info');
    }
  }
});

// Registra a diretiva na instância existente; não introduz outra dependência.
app.directive('number-pop', numberPop);
app.component('agro-chart', AgroChart);
app.component('sector-chart', SectorChart);
app.component('telemetry-chart', TelemetryChart);
app.component('agro-select', AgroSelect);
app.mount('#app');
