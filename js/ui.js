'use strict';

/* ========================
   FORMATTERS
   ======================== */
function fmtPrice(v) { return 'R$ ' + v.toFixed(2).replace('.', ','); }

function fmtCPF(v) {
  v = v.replace(/\D/g, '').slice(0,11);
  if (v.length > 9) return v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6,9)+'-'+v.slice(9);
  if (v.length > 6) return v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6);
  if (v.length > 3) return v.slice(0,3)+'.'+v.slice(3);
  return v;
}

function fmtPhone(v) {
  v = v.replace(/\D/g, '').slice(0,11);
  if (v.length > 6) return '('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);
  if (v.length > 2) return '('+v.slice(0,2)+') '+v.slice(2);
  return v;
}

function fmtCEP(v) {
  v = v.replace(/\D/g, '').slice(0,8);
  if (v.length > 5) return v.slice(0,5)+'-'+v.slice(5);
  return v;
}

/* ========================
   TOAST
   ======================== */
const Toast = (() => {
  let t;
  function show(msg, type = 'ok') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show' + (type === 'error' ? ' error' : '');
    clearTimeout(t);
    t = setTimeout(() => el.classList.remove('show'), 2800);
  }
  return { show };
})();

/* ========================
   THEME
   ======================== */
const Theme = (() => {
  const KEY = 'rize_theme_v3';

  function get()   { return localStorage.getItem(KEY) || 'light'; }
  function set(th) { document.documentElement.setAttribute('data-theme', th); localStorage.setItem(KEY, th); }
  function toggle(){ set(get() === 'light' ? 'dark' : 'light'); }

  function init() {
    set(get());
    document.getElementById('themeToggle')?.addEventListener('click', toggle);
  }

  return { init };
})();
