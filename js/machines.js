/*
 * Dados das máquinas e simulador de leituras.
 * Tudo aqui é simulado: não existe sensor real nem API por trás.
 * Quando o backend existir, basta trocar createMachines() e step()
 * por dados vindos do servidor; evaluate() e readings() continuam valendo.
 */
(function (global) {
  'use strict';

  const CATEGORIES = [
    { key: 'colheitadeira', label: 'Colheitadeiras' },
    { key: 'trator', label: 'Tratores' }
  ];

  // Limites de operação por categoria (valores de exemplo).
  const LIMITS = {
    colheitadeira: {
      temp:    { warn: 98, crit: 105 },
      rpm:     { lo: 1700, hi: 2300, critLo: 1400, critHi: 2500 },
      pressao: { warn: 3.2, crit: 2.5 }
    },
    trator: {
      temp:    { warn: 95, crit: 102 },
      rpm:     { lo: 1500, hi: 2200, critLo: 1300, critHi: 2400 },
      pressao: { warn: 3.2, crit: 2.5 }
    }
  };

  const STORAGE_KEY = 'agrosense.cadastro.v1';
  const PREFIX = { colheitadeira: 'CH', trator: 'TR' };
  const DEFAULT_NAME = { colheitadeira: 'Colheitadeira de grãos', trator: 'Trator 4x4' };
  const NORMAL_BASE = {
    colheitadeira: { temp: 87, rpm: 2050, pressao: 4.3 },
    trator: { temp: 85, rpm: 1800, pressao: 4.5 }
  };
  const BEHAVIORS = [
    { key: 'normal', label: 'Funcionando normal' },
    { key: 'temp', label: 'Temperatura alta' },
    { key: 'pressao', label: 'Pressão do óleo baixa' },
    { key: 'rpm', label: 'Rotação baixa' }
  ];

  // Setores de exemplo. Os hectares são só ilustrativos.
  const DEFAULT_SECTORS = [
    { nome: 'Setor Norte', descricao: 'Talhões de soja', hectares: 180 },
    { nome: 'Setor Sul', descricao: 'Talhões de milho', hectares: 140 },
    { nome: 'Setor Leste', descricao: 'Área de pastagem e silagem', hectares: 95 },
    { nome: 'Setor Oeste', descricao: 'Garagem e apoio', hectares: 0 }
  ];

  // base = valor em torno do qual a leitura simulada oscila.
  const SEED = [
    { id: 'CH-01', category: 'colheitadeira', name: 'Colheitadeira de grãos', modelo: 'Plataforma de 9 m', setor: 'Setor Norte', ano: 2021, horas: 3820, ultima: '18/09/2026', proxima: '18/12/2026', base: { temp: 88,  rpm: 2050, pressao: 4.3 } },
    { id: 'CH-02', category: 'colheitadeira', name: 'Colheitadeira de grãos', modelo: 'Plataforma de 9 m', setor: 'Setor Norte', ano: 2019, horas: 6410, ultima: '02/08/2026', proxima: '02/11/2026', base: { temp: 101, rpm: 2120, pressao: 4.1 } },
    { id: 'CH-03', category: 'colheitadeira', name: 'Colheitadeira de grãos', modelo: 'Plataforma de 7 m', setor: 'Setor Leste', ano: 2022, horas: 2150, ultima: '25/09/2026', proxima: '25/12/2026', base: { temp: 86,  rpm: 2000, pressao: 4.4 } },
    { id: 'CH-04', category: 'colheitadeira', name: 'Colheitadeira de grãos', modelo: 'Plataforma de 7 m', setor: 'Setor Sul',   ano: 2018, horas: 8230, ultima: '10/07/2026', proxima: '10/10/2026', base: { temp: 108, rpm: 2200, pressao: 3.9 } },
    { id: 'TR-01', category: 'trator', name: 'Trator 4x4', modelo: '180 cv',  setor: 'Setor Norte', ano: 2020, horas: 4980, ultima: '30/09/2026', proxima: '30/12/2026', base: { temp: 84, rpm: 1850, pressao: 4.6 } },
    { id: 'TR-02', category: 'trator', name: 'Trator 4x4', modelo: '180 cv',  setor: 'Setor Leste', ano: 2019, horas: 5720, ultima: '14/08/2026', proxima: '14/11/2026', base: { temp: 90, rpm: 1900, pressao: 2.9 } },
    { id: 'TR-03', category: 'trator', name: 'Trator 4x4', modelo: '150 cv',  setor: 'Setor Sul',   ano: 2023, horas: 1460, ultima: '05/10/2026', proxima: '05/01/2027', base: { temp: 85, rpm: 1780, pressao: 4.5 } },
    { id: 'TR-04', category: 'trator', name: 'Trator 4x2', modelo: '110 cv',  setor: 'Setor Sul',   ano: 2017, horas: 9040, ultima: '21/06/2026', proxima: '21/09/2026', base: { temp: 92, rpm: 1230, pressao: 3.1 } },
    { id: 'TR-05', category: 'trator', name: 'Trator 4x2', modelo: '110 cv',  setor: 'Setor Oeste', ano: 2021, horas: 3310, ultima: '12/10/2026', proxima: '12/01/2027', base: { temp: 83, rpm: 1700, pressao: 4.7 } }
  ];

  const HISTORY_SIZE = 40;

  const rnd = (a) => (Math.random() * 2 - 1) * a;
  const round = (v, d) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d);

  function fmt(n, d) {
    return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function push(list, value) {
    list.push(value);
    if (list.length > HISTORY_SIZE) list.shift();
  }

  // Avança uma leitura simulada (sem registrar nas estatísticas).
  function advance(m) {
    m.t += 1;
    const b = m.base;
    m.temp = round(b.temp + Math.sin(m.t / 6 + m.phase) * 1.1 + rnd(0.5), 1);
    m.rpm = Math.round(b.rpm + Math.sin(m.t / 3.5 + m.phase) * 35 + rnd(20));
    m.pressao = round(b.pressao + Math.cos(m.t / 8 + m.phase) * 0.1 + rnd(0.04), 2);
    push(m.history.temp, m.temp);
    push(m.history.rpm, m.rpm);
    push(m.history.pressao, m.pressao);
  }

  function newStats() {
    const st = { n: 0, warn: 0, crit: 0, since: Date.now() };
    ['temp', 'rpm', 'pressao'].forEach(k => { st[k] = { min: Infinity, max: -Infinity, sum: 0 }; });
    return st;
  }

  function resetStats(m) {
    m.stats = newStats();
  }

  // Guarda a leitura atual para o relatório.
  function record(m) {
    const st = m.stats;
    st.n += 1;
    ['temp', 'rpm', 'pressao'].forEach(k => {
      const v = m[k], o = st[k];
      if (v < o.min) o.min = v;
      if (v > o.max) o.max = v;
      o.sum += v;
    });
    const status = evaluate(m).status;
    if (status === 'warn') st.warn += 1;
    else if (status === 'crit') st.crit += 1;
  }

  function step(m) {
    advance(m);
    record(m);
  }

  // Resumo do período registrado (null se ainda não houve leitura).
  function summary(m) {
    const st = m.stats;
    if (!st || !st.n) return null;
    const pack = k => ({ min: st[k].min, avg: st[k].sum / st.n, max: st[k].max });
    return {
      n: st.n,
      temp: pack('temp'), rpm: pack('rpm'), pressao: pack('pressao'),
      warnPct: (st.warn / st.n) * 100,
      critPct: (st.crit / st.n) * 100
    };
  }

  // Transforma o cadastro (config) em máquina com leituras simuladas.
  function hydrate(cfg, index) {
    const m = Object.assign({}, cfg, {
      phase: index * 1.7,
      t: 0,
      temp: cfg.base.temp,
      rpm: cfg.base.rpm,
      pressao: cfg.base.pressao,
      history: { temp: [], rpm: [], pressao: [] }
    });
    for (let k = 0; k < HISTORY_SIZE; k++) advance(m);
    resetStats(m);
    return m;
  }

  function createMachines(configs) {
    return (configs || SEED).map((c, i) => hydrate(c, i));
  }

  // Só o que é cadastro (sem leituras), para salvar no navegador.
  function toConfig(m) {
    return {
      id: m.id, category: m.category, name: m.name, modelo: m.modelo, setor: m.setor,
      ano: m.ano, horas: m.horas, ultima: m.ultima, proxima: m.proxima,
      behavior: m.behavior || 'normal', base: m.base
    };
  }

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (d && Array.isArray(d.machines) && Array.isArray(d.sectors)) return d;
    } catch (e) { /* sem armazenamento */ }
    return null;
  }

  function save(machines, sectors) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        machines: machines.map(toConfig),
        sectors: sectors
      }));
    } catch (e) { /* sem armazenamento */ }
  }

  function clearSaved() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ok */ }
  }

  function nextId(machines, category) {
    const prefix = PREFIX[category] || 'MQ';
    let max = 0;
    machines.forEach(m => {
      if (m.id.indexOf(prefix + '-') === 0) {
        const n = parseInt(m.id.slice(prefix.length + 1), 10);
        if (!isNaN(n) && n > max) max = n;
      }
    });
    return prefix + '-' + String(max + 1).padStart(2, '0');
  }

  function isoToBr(iso) {
    if (!iso) return 'Não informada';
    const p = String(iso).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  function baseFor(category, behavior) {
    const b = Object.assign({}, NORMAL_BASE[category]);
    const lim = LIMITS[category];
    if (behavior === 'temp') b.temp = lim.temp.warn + 3;
    if (behavior === 'pressao') b.pressao = 2.9;
    if (behavior === 'rpm') b.rpm = lim.rpm.lo - 120;
    return b;
  }

  // Valida o formulário de nova máquina. Devolve { error } ou { config }.
  function buildConfig(form, machines, sectors) {
    if (!sectors.length) return { error: 'Cadastre um setor antes de adicionar máquinas.' };
    if (!form.setor) return { error: 'Escolha o setor da máquina.' };
    const category = form.category;
    let id = String(form.id || '').trim().toUpperCase();
    if (!id) id = nextId(machines, category);
    if (!/^[A-Z0-9-]{2,12}$/.test(id)) return { error: 'O número deve ter de 2 a 12 caracteres: letras, números e hífen.' };
    if (machines.some(m => m.id === id)) return { error: 'Já existe uma máquina com o número ' + id + '.' };

    const ano = form.ano === '' || form.ano == null ? null : Number(form.ano);
    if (ano !== null && (!Number.isInteger(ano) || ano < 1980 || ano > 2027)) return { error: 'Informe um ano entre 1980 e 2027.' };
    const horas = form.horas === '' || form.horas == null ? 0 : Number(form.horas);
    if (!isFinite(horas) || horas < 0) return { error: 'As horas de uso não podem ser negativas.' };

    const behavior = form.behavior || 'normal';
    return {
      config: {
        id: id,
        category: category,
        name: String(form.name || '').trim() || DEFAULT_NAME[category],
        modelo: String(form.modelo || '').trim() || 'Não informado',
        setor: form.setor,
        ano: ano,
        horas: Math.round(horas),
        ultima: isoToBr(form.ultima),
        proxima: isoToBr(form.proxima),
        behavior: behavior,
        base: baseFor(category, behavior)
      }
    };
  }

  // Média da frota por categoria ao longo do histórico, para o gráfico do dashboard.
  function fleetChart(machines, key, minSpan) {
    const w = 600, h = 170, pad = 12;
    const lines = [];
    CATEGORIES.forEach(c => {
      const list = machines.filter(m => m.category === c.key);
      if (!list.length) return;
      const len = Math.min.apply(null, list.map(m => m.history[key].length));
      const values = [];
      for (let i = 0; i < len; i++) {
        let sum = 0;
        list.forEach(m => { const hs = m.history[key]; sum += hs[hs.length - len + i]; });
        values.push(sum / list.length);
      }
      lines.push({ key: c.key, label: c.label, values: values });
    });
    let min = Infinity, max = -Infinity;
    lines.forEach(l => l.values.forEach(v => { if (v < min) min = v; if (v > max) max = v; }));
    if (!lines.length) return { lines: [], min: 0, mid: 0, max: 0 };
    const span = Math.max(max - min, minSpan);
    const mid = (max + min) / 2;
    const lo = mid - span / 2, hi = mid + span / 2;
    lines.forEach(l => {
      l.last = l.values[l.values.length - 1];
      l.points = l.values.map((v, i) => {
        const x = (i / (l.values.length - 1)) * w;
        const y = h - pad - ((v - lo) / span) * (h - pad * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
    });
    return { lines: lines, min: lo, mid: mid, max: hi };
  }

  const levelHigh = (v, l) => (v >= l.crit ? 2 : v > l.warn ? 1 : 0);
  const levelLow = (v, l) => (v <= l.crit ? 2 : v < l.warn ? 1 : 0);
  const levelRpm = (v, l) => (v <= l.critLo || v >= l.critHi ? 2 : v < l.lo || v > l.hi ? 1 : 0);

  const STATUS = ['ok', 'warn', 'crit'];
  const STATUS_LABEL = ['Normal', 'Atenção', 'Crítico'];

  // Compara as leituras com os limites e devolve status e pontos de problema.
  // "anchor" diz em que ponto do modelo 3D o marcador vermelho aparece.
  function evaluate(m) {
    const lim = LIMITS[m.category];
    const levels = {
      temp: levelHigh(m.temp, lim.temp),
      rpm: levelRpm(m.rpm, lim.rpm),
      pressao: levelLow(m.pressao, lim.pressao)
    };
    const issues = [];
    if (levels.temp) {
      issues.push({
        key: 'temp', anchor: 'motor', part: 'Motor', level: levels.temp,
        text: 'Temperatura em ' + fmt(m.temp, 1) + ' °C, acima de ' + lim.temp.warn + ' °C'
      });
    }
    if (levels.rpm) {
      issues.push({
        key: 'rpm', anchor: 'transmissao', part: 'Transmissão', level: levels.rpm,
        text: m.rpm < lim.rpm.lo
          ? 'Rotação em ' + fmt(m.rpm, 0) + ' rpm, abaixo de ' + fmt(lim.rpm.lo, 0) + ' rpm'
          : 'Rotação em ' + fmt(m.rpm, 0) + ' rpm, acima de ' + fmt(lim.rpm.hi, 0) + ' rpm'
      });
    }
    if (levels.pressao) {
      issues.push({
        key: 'pressao', anchor: 'hidraulica', part: 'Sistema hidráulico', level: levels.pressao,
        text: 'Pressão do óleo em ' + fmt(m.pressao, 2) + ' bar, abaixo de ' + fmt(lim.pressao.warn, 1) + ' bar'
      });
    }
    const worst = Math.max(0, levels.temp, levels.rpm, levels.pressao);
    return { levels, issues, status: STATUS[worst], label: STATUS_LABEL[worst] };
  }

  // Linha do mini-gráfico. minSpan evita que uma oscilação pequena pareça grande.
  function spark(list, minSpan) {
    const w = 120, h = 38, pad = 5;
    if (list.length < 2) return '';
    const min = Math.min.apply(null, list);
    const max = Math.max.apply(null, list);
    const span = Math.max(max - min, minSpan);
    const mid = (max + min) / 2;
    return list.map((v, i) => {
      const x = (i / (list.length - 1)) * w;
      const y = h / 2 - ((v - mid) / span) * (h - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }

  // Dados prontos para os três blocos de leitura da tela de detalhe.
  function readings(m) {
    const lim = LIMITS[m.category];
    const ev = evaluate(m);
    return [
      {
        key: 'temp', label: 'Temperatura do motor',
        value: fmt(m.temp, 1), unit: '°C', level: ev.levels.temp,
        range: 'Faixa normal: até ' + lim.temp.warn + ' °C',
        points: spark(m.history.temp, 6)
      },
      {
        key: 'rpm', label: 'Rotação',
        value: fmt(m.rpm, 0), unit: 'rpm', level: ev.levels.rpm,
        range: 'Faixa normal: ' + fmt(lim.rpm.lo, 0) + ' a ' + fmt(lim.rpm.hi, 0) + ' rpm',
        points: spark(m.history.rpm, 300)
      },
      {
        key: 'pressao', label: 'Pressão do óleo',
        value: fmt(m.pressao, 2), unit: 'bar', level: ev.levels.pressao,
        range: 'Faixa normal: a partir de ' + fmt(lim.pressao.warn, 1) + ' bar',
        points: spark(m.history.pressao, 1)
      }
    ];
  }

  global.AgroData = {
    CATEGORIES, LIMITS, BEHAVIORS, DEFAULT_SECTORS, DEFAULT_NAME,
    createMachines, hydrate, step, evaluate, readings, fmt, summary, resetStats,
    load, save, clearSaved, nextId, buildConfig, fleetChart
  };
})(window);
