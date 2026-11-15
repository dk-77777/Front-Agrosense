/* Select-only combobox: focus stays on the trigger; options use active descendant. */
let selectSequence = 0;
const AgroSelect = {
  props: { modelValue: String, options: Array, label: String, disabled: Boolean },
  emits: ['update:modelValue'],
  data() { return { open: false, active: 0, id: `ag-select-${++selectSequence}`, position: {}, search: '', searchAt: 0 }; },
  computed: { selected() { return this.options.find(o => o.value === this.modelValue)?.label || 'Selecione'; } },
  template: `<div class="ag-select"><button ref="trigger" type="button" class="ag-select-trigger" role="combobox" aria-haspopup="listbox" :aria-label="label" :aria-expanded="open" :aria-controls="id" :aria-activedescendant="open ? id + '-' + active : undefined" :disabled="disabled || !options.length" @click="toggle" @keydown="key" @blur="close"><span>{{ selected }}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><Teleport to="body"><Transition name="ag-select"><div v-if="open" :id="id" ref="list" role="listbox" :aria-label="label" class="ag-select-menu" :style="position" @pointerdown.prevent><div v-for="(option,i) in options" :key="option.value" :id="id+'-'+i" role="option" :aria-selected="modelValue === option.value" :class="['ag-select-option', { active: active === i }]" @pointermove="active = i" @click="choose(i)"><span>{{ option.label }}</span><span v-if="modelValue === option.value" aria-hidden="true">✓</span></div></div></Transition></Teleport></div>`,
  mounted() { document.addEventListener('pointerdown', this.outside); window.addEventListener('resize', this.close); window.addEventListener('scroll', this.scrolled, true); },
  beforeUnmount() { document.removeEventListener('pointerdown', this.outside); window.removeEventListener('resize', this.close); window.removeEventListener('scroll', this.scrolled, true); },
  watch: { options(value, old) { if (this.open && JSON.stringify(value) !== JSON.stringify(old)) this.close(); }, disabled(value) { if(value) this.close(); } },
  methods: {
    close() { this.open = false; },
    outside(event) { if (!this.$el.contains(event.target) && !this.$refs.list?.contains(event.target)) this.close(); },
    scrolled(event) { if (!this.$refs.list?.contains(event.target)) this.close(); },
    toggle() { if (this.open) return this.close(); const r = this.$refs.trigger.getBoundingClientRect(); const below = innerHeight - r.bottom - 12; const above = r.top - 12; const down = below >= Math.min(280, this.options.length * 44 + 12) || below >= above; this.position = { left: `${Math.max(8, Math.min(r.left, innerWidth - Math.max(r.width, 180) - 8))}px`, width: `${Math.min(Math.max(r.width, 180), innerWidth - 16)}px`, maxHeight: `${Math.max(44, Math.min(280, down ? below : above))}px`, ...(down ? {top: `${r.bottom + 6}px`} : {bottom: `${innerHeight - r.top + 6}px`}) }; this.active = Math.max(0, this.options.findIndex(o => o.value === this.modelValue)); this.open = true; this.reveal(); },
    reveal() { this.$nextTick(() => { const list=this.$refs.list, item=document.getElementById(`${this.id}-${this.active}`); if(!list || !item) return; if(item.offsetTop < list.scrollTop) list.scrollTop=item.offsetTop; else if(item.offsetTop+item.offsetHeight > list.scrollTop+list.clientHeight) list.scrollTop=item.offsetTop+item.offsetHeight-list.clientHeight; }); },
    choose(index) { this.$emit('update:modelValue', this.options[index].value); this.close(); this.$refs.trigger.focus(); },
    key(event) {
      const k = event.key;
      if (k === 'Escape') { if(this.open) { event.stopPropagation(); event.preventDefault(); this.close(); } return; }
      if (k === 'Tab') return this.close();
      if (['Enter',' '].includes(k)) { event.preventDefault(); return this.open ? this.choose(this.active) : this.toggle(); }
      if (['ArrowDown','ArrowUp','Home','End'].includes(k)) { event.preventDefault(); if(!this.open) this.toggle(); else this.active = k === 'Home' ? 0 : k === 'End' ? this.options.length-1 : Math.max(0,Math.min(this.options.length-1,this.active+(k === 'ArrowDown'?1:-1))); this.reveal(); return; }
      if(k.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); if(!this.open) this.toggle(); this.search = Date.now()-this.searchAt > 700 ? k : this.search+k; this.searchAt=Date.now(); const i=this.options.findIndex(o=>o.label.toLocaleLowerCase('pt-BR').startsWith(this.search.toLocaleLowerCase('pt-BR'))); if(i>=0) {this.active=i;this.reveal();} }
    }
  }
};
