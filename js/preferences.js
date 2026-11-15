/* Preferências locais do AgroSense. Trocar este adaptador por API quando existir backend. */
(() => {
  'use strict';

  const PREFIX = 'agrosense:preferences:v1:';
  const DEFAULTS = Object.freeze({
    density: 'comfortable',
    textSize: 'standard',
    internalNotifications: true,
    attentionNotices: true,
    criticalNotices: true,
    machineSort: 'id',
    telemetryMetric: 'temp',
    telemetryScope: 'all',
    telemetryOnlyAlerts: false
  });
  const choices = Object.freeze({
    density: ['comfortable', 'compact'],
    textSize: ['standard', 'large'],
    machineSort: ['id', 'sector', 'severity'],
    telemetryMetric: ['temp', 'rpm', 'pressao']
  });

  function keyFor(userId) {
    // A chave usa somente o identificador da sessão, nunca senha nem token.
    return PREFIX + encodeURIComponent(String(userId || 'local').trim().toLowerCase());
  }
  function validScope(value) {
    return value === 'all'
      || value === 'cat:trator'
      || value === 'cat:colheitadeira'
      || (typeof value === 'string' && /^m:[a-z0-9_-]{1,48}$/i.test(value));
  }
  function normalize(value) {
    const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const clean = { ...DEFAULTS };
    for (const field of Object.keys(choices)) {
      if (choices[field].includes(input[field])) clean[field] = input[field];
    }
    for (const field of ['internalNotifications', 'attentionNotices', 'criticalNotices', 'telemetryOnlyAlerts']) {
      if (typeof input[field] === 'boolean') clean[field] = input[field];
    }
    if (validScope(input.telemetryScope)) clean.telemetryScope = input.telemetryScope;
    return clean;
  }
  function load(userId) {
    try { return normalize(JSON.parse(localStorage.getItem(keyFor(userId)) || 'null')); }
    catch (_) { return normalize(null); }
  }
  function save(userId, value) {
    const clean = normalize(value);
    try {
      localStorage.setItem(keyFor(userId), JSON.stringify(clean));
      return { ok: true, value: clean };
    } catch (_) {
      return { ok: false, value: clean };
    }
  }
  function restore(userId) { return save(userId, DEFAULTS); }
  window.AgroPreferences = Object.freeze({
    defaults: () => ({ ...DEFAULTS }),
    normalize,
    load,
    save,
    restore
  });
})();
