/* Autenticação de navegação demonstrativa, SEM backend ou proteção real. */
(() => {
  'use strict';
  const KEY = 'agrosense-demo-session';
  const DEMO_PASSWORD = 'Agro2026!';
  const accounts = Object.freeze({
    'operador@agrosense.com': { nome: 'Operador', perfil: 'operador' },
    'tecnico@agrosense.com': { nome: 'Técnico', perfil: 'tecnico' },
    'gestor@agrosense.com': { nome: 'Gestor', perfil: 'gestor' }
  });
  function session() {
    try {
      const value = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      const email = typeof value?.email === 'string' ? value.email : '';
      const known = accounts[email];
      return known && value?.perfil === known.perfil
        ? { email, nome: known.nome, perfil: known.perfil }
        : null;
    } catch (_) { return null; }
  }
  window.AgroSenseAuth = Object.freeze({
    async login({ email, password }) {
      const normalized = String(email || '').trim().toLowerCase();
      const user = accounts[normalized];
      if (!user || password !== DEMO_PASSWORD) throw { code: 'INVALID_CREDENTIALS' };
      const signedIn = { ...user, email: normalized };
      sessionStorage.setItem(KEY, JSON.stringify(signedIn));
      return signedIn;
    },
    session,
    logout() {
      sessionStorage.removeItem(KEY);
      location.replace('login.html');
    },
    // A recuperação depende de servidor/e-mail. Não fingir que um link foi enviado.
    async requestPasswordReset() { throw { code: 'NOT_CONNECTED' }; }
  });
})();
