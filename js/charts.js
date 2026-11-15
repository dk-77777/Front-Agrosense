/* AgroSense: preserve fleetChart averages; only the rendering changes. */
echarts.registerTheme('agrosense', {
  color: ['#294D3E', '#A87532'],
  textStyle: { fontFamily: 'Inter, sans-serif', color: '#24342B' },
  backgroundColor: 'transparent'
});
const AgroChart = {
  props: ['chart', 'meta'],
  template: `<div class="ag-chart-wrap"><div ref="plot" class="ag-chart" tabindex="0" :aria-label="summary" @keydown.left.prevent="inspect(-1)" @keydown.right.prevent="inspect(1)" @blur="hideTip"></div><p v-if="!hasData" class="ag-chart-empty">Sem leituras disponíveis para esta frota.</p><p class="sr-only">Use as setas esquerda e direita para consultar as amostras.</p><span class="sr-only" aria-live="polite">{{ selection }}</span></div>`,
  data() { return { selection: '', index: -1 }; },
  computed: {
    hasData() { return this.chart.lines.some(l => l.values.length); },
    summary() { return this.meta.label + ': média por categoria. ' + this.chart.lines.map(l => l.label + ': ' + AgroData.fmt(l.last, this.meta.digits) + ' ' + this.meta.unit).join('. '); }
  },
  mounted() {
    this.plot = Vue.markRaw(echarts.init(this.$refs.plot, 'agrosense', { renderer: 'svg' }));
    this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onMotion = () => this.render();
    this.motion.addEventListener('change', this.onMotion);
    this.observer = new ResizeObserver(() => this.plot.resize());
    this.observer.observe(this.$refs.plot);
    this.render();
  },
  watch: {
    chart: { deep: true, handler() { this.render(); } },
    meta() { this.index = -1; this.selection = ''; this.hideTip(); this.render(); }
  },
  beforeUnmount() { this.observer.disconnect(); this.motion.removeEventListener('change', this.onMotion); this.plot.dispose(); },
  methods: {
    hideTip() { this.plot?.dispatchAction({ type: 'hideTip' }); },
    inspect(direction) {
      const count = Math.max(0, ...this.chart.lines.map(l => l.values.length));
      if (!count) return;
      this.index = Math.max(0, Math.min(count - 1, (this.index < 0 ? count - 1 : this.index) + direction));
      this.plot.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: this.index });
      this.selection = this.chart.lines.map(l => `${l.label}: ${AgroData.fmt(l.values[this.index], this.meta.digits)} ${this.meta.unit}`).join('. ');
    },
    render() {
      if (!this.plot) return;
      const { chart, meta } = this;
      this.plot.setOption({
        animation: !this.motion.matches, animationDuration: 320, animationDurationUpdate: 280, animationEasingUpdate: 'cubicOut',
        grid: { top: 30, right: 18, bottom: 28, left: 12, containLabel: true },
        tooltip: { trigger: 'axis', confine: true, renderMode: 'richText', backgroundColor: '#fff', borderColor: '#DCE6DD', padding: 12,
          valueFormatter: v => `${AgroData.fmt(v, meta.digits)} ${meta.unit}` },
        xAxis: { type: 'value', max: 0, name: '', axisLine: { lineStyle: { color: '#DCE6DD' } }, splitLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#657369', formatter: v => v === 0 ? 'Agora' : `${v} s` } },
        yAxis: { type: 'value', name: meta.unit, min: this.hasData ? chart.min : 0, max: this.hasData ? chart.max : 1, splitNumber: 3,
          axisLabel: { color: '#657369', formatter: v => AgroData.fmt(v, meta.digits) }, splitLine: { lineStyle: { color: '#E7EDE7', type: 'dashed' } } },
        series: chart.lines.map((line, i) => ({ id: line.key, name: line.label, type: 'line', smooth: false, showSymbol: false, symbolSize: 6,
          lineStyle: { width: 2, type: i ? 'dashed' : 'solid' }, emphasis: { focus: 'series' },
          data: line.values.map((v, index) => [-(line.values.length - 1 - index) * 2, v]) }))
      }, { replaceMerge: ['series'] });
    }
  }
};

/* Por setor: colunas empilhadas derivadas das máquinas reais (Normal / Atenção / Crítica). */
const SectorChart = {
  props: ['rows', 'selected'],
  emits: ['select'],
  template: `<div class="ag-chart-wrap"><div ref="plot" class="ag-chart sector-chart" role="img" :aria-label="summary"></div>
    <ul class="ag-legend"><li v-for="l in legend" :key="l.k"><i :style="{ background: l.color }"></i>{{ l.label }} <b>{{ l.n }}</b></li></ul></div>`,
  computed: {
    legend() {
      const sum = k => this.rows.reduce((a, r) => a + r[k], 0);
      return [{ k: 'ok', label: 'Normal', color: '#287A52', n: sum('ok') }, { k: 'warn', label: 'Em atenção', color: '#B67B20', n: sum('warn') }, { k: 'crit', label: 'Crítica', color: '#B94145', n: sum('crit') }];
    },
    summary() { return 'Máquinas por setor e estado. ' + this.rows.map(r => r.s.nome + ': ' + r.ok + ' normais, ' + r.warn + ' em atenção, ' + r.crit + ' críticas').join('. '); }
  },
  mounted() {
    this.plot = Vue.markRaw(echarts.init(this.$refs.plot, 'agrosense', { renderer: 'svg' }));
    this.plot.on('click', p => { const r = this.rows[p.dataIndex]; if (r) this.$emit('select', r.s.nome); });
    this.plot.getZr().on('click', e => { if (!e.target) return; });
    this.observer = new ResizeObserver(() => this.plot.resize());
    this.observer.observe(this.$refs.plot);
    this.render();
  },
  watch: { rows: { deep: true, handler() { this.render(); } }, selected() { this.render(); } },
  beforeUnmount() { this.observer.disconnect(); this.plot.dispose(); },
  methods: {
    render() {
      const rows = this.rows, sel = this.selected;
      const mk = (key, name, color) => ({ name, type: 'bar', stack: 'total', barWidth: '46%', barMaxWidth: 40, cursor: 'pointer',
        itemStyle: { color, borderColor: '#fff', borderWidth: 1 },
        data: rows.map(r => ({ value: r[key], itemStyle: { color, opacity: !sel || sel === r.s.nome ? 1 : .5 } })),
        label: { show: true, formatter: p => p.value ? p.value : '', color: '#fff', fontSize: 11, fontWeight: 600 },
        emphasis: { disabled: true } });
      this.plot.setOption({
        animation: false,
        grid: { top: 26, right: 4, bottom: 4, left: 4, containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(18,58,46,.06)' } }, confine: true, backgroundColor: '#fff', borderColor: '#DCE5DF', padding: [8, 10], textStyle: { color: '#182723', fontSize: 12 },
          formatter: ps => { const r = rows[ps[0].dataIndex]; const line = (c, t, n) => `<div style="display:flex;justify-content:space-between;gap:18px"><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${c};margin-right:6px"></i>${t}</span><b>${n}</b></div>`;
            return `<div style="font-weight:600;margin-bottom:4px">${r.s.nome} · ${r.total} ${r.total === 1 ? 'máquina' : 'máquinas'}</div>${line('#287A52', 'Normal', r.ok)}${line('#B67B20', 'Em atenção', r.warn)}${line('#B94145', 'Crítica', r.crit)}<div style="margin-top:5px;color:#64736D;font-size:11px">Clique para listar os equipamentos</div>`; } },
        xAxis: { type: 'category', data: rows.map(r => r.s.nome), axisTick: { show: false }, axisLine: { lineStyle: { color: '#C9D5CD' } },
          axisLabel: { interval: 0, color: '#3C4B45', fontSize: 11.5, margin: 10, formatter: (v, i) => { const r = rows[i]; const n = v.replace('Setor ', ''); return r && r.crit ? `{c|▲ }{n|${n}}` : `{n|${n}}`; }, rich: { c: { color: '#B94145', fontSize: 10 }, n: { color: '#182723', fontSize: 11.5 } } } },
        yAxis: { type: 'value', name: 'máquinas', nameGap: 10, nameTextStyle: { color: '#64736D', fontSize: 11, align: 'left' }, minInterval: 1, axisLabel: { color: '#64736D', fontSize: 11 }, splitLine: { lineStyle: { color: '#E8EEEA' } } },
        series: [mk('ok', 'Normal', '#287A52'), mk('warn', 'Em atenção', '#B67B20'), mk('crit', 'Crítica', '#B94145')]
      }, true);
    }
  }
};

/* Telemetria: uma série por máquina (histórico real da simulação), com limites da categoria quando o escopo tem uma só. */
const TelemetryChart = {
  props: ['series', 'limits', 'meta'],
  template: `<div class="ag-chart-wrap"><div ref="plot" class="ag-chart tele-chart" tabindex="0" role="img" :aria-label="summary" @keydown.left.prevent="inspect(-1)" @keydown.right.prevent="inspect(1)" @blur="hideTip"></div><span class="sr-only" aria-live="polite">{{ selection }}</span></div>`,
  data() { return { selection: '', index: -1 }; },
  computed: {
    summary() { return this.meta.label + ': ' + this.series.map(s => s.id + ' ' + AgroData.fmt(s.now, this.meta.digits) + ' ' + this.meta.unit).join('; ') + '. Use as setas para consultar as amostras.'; }
  },
  mounted() {
    this.plot = Vue.markRaw(echarts.init(this.$refs.plot, 'agrosense', { renderer: 'svg' }));
    this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.observer = new ResizeObserver(() => this.plot.resize());
    this.observer.observe(this.$refs.plot);
    this.render();
  },
  watch: { series: { deep: true, handler() { this.render(); } }, limits: { deep: true, handler() { this.render(); } }, meta() { this.index = -1; this.selection = ''; this.render(); } },
  beforeUnmount() { this.observer.disconnect(); this.plot.dispose(); },
  methods: {
    hideTip() { this.plot && this.plot.dispatchAction({ type: 'hideTip' }); },
    inspect(d) {
      const n = Math.max(0, ...this.series.map(s => s.values.length)); if (!n) return;
      this.index = Math.max(0, Math.min(n - 1, (this.index < 0 ? n - 1 : this.index) + d));
      this.plot.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: this.index });
      this.selection = this.series.map(s => s.id + ': ' + AgroData.fmt(s.values[s.values.length - n + this.index], this.meta.digits) + ' ' + this.meta.unit).join('. ');
    },
    render() {
      if (!this.plot) return;
      const { series, limits, meta } = this, f = v => AgroData.fmt(v, meta.digits);
      const LC = ['#5C8A73', '#B67B20', '#B94145'], TXT = ['Normal', 'Atenção', 'Crítico'], SYM = ['✓', '●', '▲'];
      const vals = []; series.forEach(s => s.values.forEach(v => vals.push(v))); limits.forEach(l => vals.push(l.v));
      let lo = Math.min(...vals), hi = Math.max(...vals); const pad = (hi - lo) * .06 || meta.step;
      lo = Math.floor((lo - pad) / meta.step) * meta.step; hi = Math.ceil((hi + pad) / meta.step) * meta.step;
      const interval = meta.step * Math.max(1, Math.ceil((hi - lo) / meta.step / 6)); hi = lo + Math.ceil((hi - lo) / interval) * interval;
      const len = Math.max(...series.map(s => s.values.length));
      const only = series.length === 1;
      const lines = series.map(s => { const col = only && !s.level ? '#123A2E' : LC[s.level];
        return { id: s.id, name: s.id, type: 'line', showSymbol: false, z: 2 + s.level, smooth: false,
          lineStyle: { width: s.level === 2 ? 2.6 : only ? 2.4 : s.level ? 2.2 : 1.5, color: col, opacity: only || s.level ? 1 : .8 },
          emphasis: { focus: 'series', lineStyle: { width: 3 } },
          endLabel: { show: true, formatter: '{a}', color: col, fontSize: 11, fontWeight: 600 }, labelLayout: { hideOverlap: true },
          data: s.values.map((v, i) => [-(s.values.length - 1 - i) * 2, v]) }; });
      lines.push({ id: 'limits', name: 'limites', type: 'line', silent: true, data: [], markLine: { silent: true, symbol: 'none', animation: false,
        data: limits.map(l => ({ yAxis: l.v, lineStyle: { color: l.level === 2 ? '#B94145' : '#B67B20', type: 'dashed', width: 1.2 },
          label: { formatter: `${l.label} ${f(l.v)} ${meta.unit}`, position: 'insideStartTop', color: l.level === 2 ? '#9E2F33' : '#7A5010', fontSize: 11 } })) } });
      this.plot.setOption({
        animation: !this.motion.matches, animationDuration: 200, animationDurationUpdate: 200,
        grid: { top: 30, right: 58, bottom: 4, left: 6, containLabel: true },
        tooltip: { trigger: 'axis', confine: true, backgroundColor: '#fff', borderColor: '#DCE5DF', padding: [8, 10], textStyle: { color: '#182723', fontSize: 12 },
          formatter: ps => { const real = ps.filter(p => p.seriesId !== 'limits'); if (!real.length) return '';
            const x = real[0].value[0]; const head = x === 0 ? 'Agora' : 'há ' + (-x) + ' s';
            return `<div style="font-weight:600;margin-bottom:4px">${head}</div>` + real.sort((a, b) => b.value[1] - a.value[1]).map(p => { const s = series.find(q => q.id === p.seriesId);
              return `<div style="display:flex;justify-content:space-between;gap:16px"><span style="color:${LC[s.level]}">${SYM[s.level]} <b>${s.id}</b></span><span>${f(p.value[1])} ${meta.unit} · ${TXT[s.level]}</span></div>`; }).join(''); } },
        xAxis: { type: 'value', min: -(len - 1) * 2, max: 0, interval: 20, splitLine: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: '#C9D5CD' } },
          axisLabel: { color: '#64736D', fontSize: 11, formatter: v => v === 0 ? 'Agora' : v + ' s' } },
        yAxis: { type: 'value', min: lo, max: hi, interval: interval, name: meta.unit, nameTextStyle: { color: '#64736D', fontSize: 11, align: 'left' },
          axisLine: { show: false, onZero: false }, axisTick: { show: false },
          axisLabel: { color: '#64736D', fontSize: 11, formatter: v => AgroData.fmt(v, meta.step < 1 ? 1 : 0) }, splitLine: { lineStyle: { color: '#E8EEEA' } } },
        series: lines
      }, true);
    }
  }
};
