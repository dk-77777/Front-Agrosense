/* AgroSense · Recuperar senha.
 * PONTO DE INTEGRAÇÃO: este arquivo NÃO envia e-mail. Ele chama window.AgroSenseAuth.requestPasswordReset({ email }),
 * fornecida pelo mecanismo de autenticação do projeto. Deve resolver (sem revelar se a conta existe) ou rejeitar com { code }.
 */
(() => {
  'use strict';

  const MESSAGES = {
    NOT_CONNECTED: 'A recuperação de senha ainda não está conectada a esta tela.',
    RATE_LIMIT: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    DEFAULT: 'Não foi possível enviar agora. Tente novamente em instantes.'
  };

  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const form = $('#reset-form'), email = $('#email'), btn = $('#enviar'), label = $('.ag-btn__label');
  const alertBox = $('#form-status'), srStatus = $('#sr-status'), done = $('#reset-done'), doneEmail = $('#done-email');
  const idleText = label.textContent;

  const logo = $('.ag-logo');
  const logoFallback = () => {
    const t = document.createElement('p');
    t.className = 'ag-logo ag-logo--text'; t.textContent = 'AgroSense'; t.setAttribute('data-r', ''); t.style.setProperty('--d', '1');
    logo.replaceWith(t);
  };
  if (logo.complete && logo.naturalWidth === 0) logoFallback(); else logo.addEventListener('error', logoFallback, { once: true });

  const title = $('.ag-title');
  title.innerHTML = title.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ');

  const start = () => requestAnimationFrame(() => { root.classList.add('ag-ready'); window.AgroScene && AgroScene.run(); });
  Promise.race([document.fonts && document.fonts.ready, new Promise((r) => setTimeout(r, 500))]).then(start);

  function check() {
    const box = $('#email-erro');
    let msg = '';
    if (!email.validity.valid) msg = email.validity.valueMissing ? 'Informe seu e-mail.' : 'Informe um e-mail válido.';
    box.textContent = msg;
    email.setAttribute('aria-invalid', String(!!msg));
    email.closest('.ag-field').classList.toggle('has-error', !!msg);
    return !msg;
  }
  email.addEventListener('blur', () => { if (email.value) check(); });
  email.addEventListener('input', () => { if (email.getAttribute('aria-invalid') === 'true') check(); });

  function setState(state) {
    btn.dataset.state = state;
    btn.setAttribute('aria-disabled', String(state === 'loading'));
    label.textContent = { idle: idleText, loading: 'Enviando…', success: 'Link enviado' }[state];
    srStatus.textContent = { idle: '', loading: 'Enviando o link de recuperação.', success: 'Link enviado. Verifique seu e-mail.' }[state];
  }
  function shake(el) {
    if (reduce) return;
    el.classList.remove('is-shaking'); void el.offsetWidth; el.classList.add('is-shaking');
    el.addEventListener('animationend', () => el.classList.remove('is-shaking'), { once: true });
  }

  async function send() {
    alertBox.hidden = true;
    if (!check()) { email.focus(); return shake(email.closest('.ag-field')); }
    setState('loading');
    try {
      const fn = window.AgroSenseAuth && window.AgroSenseAuth.requestPasswordReset;
      if (typeof fn !== 'function') throw { code: 'NOT_CONNECTED' };
      await fn({ email: email.value.trim() });
      setState('success');
      doneEmail.textContent = email.value.trim();
      setTimeout(() => {
        form.hidden = true; done.hidden = false; $('.ag-lead').hidden = true;
        title.textContent = 'Link enviado.'; $('#reenviar').focus();
      }, reduce ? 200 : 600);
    } catch (err) {
      setState('idle');
      alertBox.textContent = MESSAGES[err && err.code] || MESSAGES.DEFAULT; alertBox.hidden = false;
      shake($('.ag-actions'));
    }
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); if (btn.dataset.state === 'loading' || btn.dataset.state === 'success') return; send(); });

  $('#reenviar').addEventListener('click', () => {
    done.hidden = true; form.hidden = false; $('.ag-lead').hidden = false;
    title.textContent = 'Esqueceu sua senha?'; setState('idle'); email.focus();
  });

  /* Parallax suave (igual ao login) */
  const visual = $('.ag-visual');
  if (visual && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let raf = 0;
    const set = (x, y) => { visual.style.setProperty('--px', x); visual.style.setProperty('--py', y); };
    visual.addEventListener('pointermove', (e) => {
      const r = visual.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5).toFixed(3), y = ((e.clientY - r.top) / r.height - 0.5).toFixed(3);
      cancelAnimationFrame(raf); raf = requestAnimationFrame(() => set(x, y));
    });
    visual.addEventListener('pointerleave', () => set(0, 0));
  }
})();
