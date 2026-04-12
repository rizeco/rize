'use strict';

const WA_NUMBER = '5548999999999'; // 🔧 Substitua: 55 + DDD + número

/* ========================
   RENDER
   ======================== */
function renderCartPage() {
  const items   = Cart.getItems();
  const emptyEl = document.getElementById('cpEmpty');
  const layoutEl= document.getElementById('cpLayout');

  if (!items.length) {
    if (emptyEl)  emptyEl.style.display = 'flex';
    if (layoutEl) layoutEl.style.display = 'none';
    return;
  }
  if (emptyEl)  emptyEl.style.display = 'none';
  if (layoutEl) layoutEl.style.display = 'grid';

  _renderItems(items);
  _renderSummary(items);
}

function _renderItems(items) {
  const el = document.getElementById('cpItems');
  if (!el) return;

  el.innerHTML = items.map(item => `
    <div class="cp-item" data-line="${item.lineId}">
      <img src="${item.image}" alt="${item.name}" class="cp-item__img" />
      <div>
        <p class="cp-item__name">${item.name}</p>
        <p class="cp-item__meta">${item.variant} · Tam. ${item.size}</p>
        <div class="cp-item__controls">
          <div class="qty-ctrl" aria-label="Quantidade">
            <button class="qty-btn qty-minus" data-line="${item.lineId}">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn qty-plus" data-line="${item.lineId}">+</button>
          </div>
          <button class="cp-item__remove" data-line="${item.lineId}">Remover</button>
        </div>
      </div>
      <span class="cp-item__price">${fmtPrice(item.price * item.qty)}</span>
    </div>`).join('');

  el.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const it = Cart.getItems().find(i => i.lineId === btn.dataset.line);
      if (it) Cart.setQty(btn.dataset.line, it.qty - 1);
    });
  });
  el.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const it = Cart.getItems().find(i => i.lineId === btn.dataset.line);
      if (it) Cart.setQty(btn.dataset.line, it.qty + 1);
    });
  });
  el.querySelectorAll('.cp-item__remove').forEach(btn => {
    btn.addEventListener('click', () => Cart.remove(btn.dataset.line));
  });
}

function _renderSummary(items) {
  const sumEl     = document.getElementById('summaryItems');
  const subtotEl  = document.getElementById('summarySubtotal');
  const totalEl   = document.getElementById('summaryTotal');
  const total     = Cart.getTotal();

  if (sumEl) {
    sumEl.innerHTML = items.map(item => `
      <div class="sum-item">
        <img src="${item.image}" alt="${item.name}" class="sum-item__img" />
        <div class="sum-item__info">
          <p class="sum-item__name">${item.name}</p>
          <p class="sum-item__meta">${item.variant} · ${item.size} · ×${item.qty}</p>
        </div>
        <span class="sum-item__price">${fmtPrice(item.price * item.qty)}</span>
      </div>`).join('');
  }
  if (subtotEl) subtotEl.textContent = fmtPrice(total);
  if (totalEl)  totalEl.textContent  = fmtPrice(total);
}

/* ========================
   FORM MASKS
   ======================== */
function initMasks() {
  const cpf  = document.getElementById('f-cpf');
  const tel  = document.getElementById('f-tel');
  const cep  = document.getElementById('f-cep');

  cpf?.addEventListener('input', () => { cpf.value = fmtCPF(cpf.value); });
  tel?.addEventListener('input', () => { tel.value = fmtPhone(tel.value); });
  cep?.addEventListener('input', () => {
    cep.value = fmtCEP(cep.value);
    if (cep.value.replace(/\D/g,'').length === 8) lookupCEP();
  });
}

/* ========================
   CEP LOOKUP
   ======================== */
async function lookupCEP() {
  const cepEl = document.getElementById('f-cep');
  const raw   = cepEl?.value.replace(/\D/g,'');
  if (!raw || raw.length !== 8) return;

  const btn = document.getElementById('cepBtn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }

  try {
    const res  = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
    const data = await res.json();
    if (data.erro) { Toast.show('CEP não encontrado.', 'error'); return; }
    const s = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    s('f-rua', data.logradouro || '');
    s('f-bairro', data.bairro || '');
    s('f-cidade', data.localidade || '');
    s('f-uf', data.uf || '');
    Toast.show('Endereço preenchido ✓');
  } catch {
    Toast.show('Erro ao buscar CEP.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}

/* ========================
   VALIDATION
   ======================== */
function validate() {
  const required = [
    { id: 'f-nome',   label: 'Nome' },
    { id: 'f-cpf',    label: 'CPF' },
    { id: 'f-tel',    label: 'WhatsApp' },
    { id: 'f-cep',    label: 'CEP' },
    { id: 'f-uf',     label: 'UF' },
    { id: 'f-cidade', label: 'Cidade' },
    { id: 'f-rua',    label: 'Rua' },
    { id: 'f-num',    label: 'Número' },
    { id: 'f-bairro', label: 'Bairro' },
  ];

  if (!Cart.getCount()) {
    Toast.show('Carrinho vazio.', 'error');
    return false;
  }

  let first = null;
  required.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    el.classList.remove('error');
    if (!el.value.trim()) {
      el.classList.add('error');
      if (!first) first = { el, label: f.label };
    }
  });

  if (first) {
    Toast.show(`Campo obrigatório: ${first.label}`, 'error');
    first.el.focus();
    first.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  return true;
}

/* ========================
   WHATSAPP MESSAGE
   ======================== */
function buildMessage() {
  const g = id => document.getElementById(id)?.value?.trim() || '';
  const items = Cart.getItems();
  const total = Cart.getTotal();

  const lines = items.map(i =>
    `• ${i.name} (${i.variant}) Tam.${i.size} × ${i.qty} = ${fmtPrice(i.price * i.qty)}`
  ).join('\n');

  const comp = g('f-comp') ? `, ${g('f-comp')}` : '';

  return [
    `👁️ *PEDIDO RIZE™ — DROP 001*`,
    ``,
    `*ITENS:*`,
    lines,
    ``,
    `*TOTAL: ${fmtPrice(total)}*`,
    `_(frete a combinar)_`,
    ``,
    `━━━━━━━━━━━━`,
    `*CLIENTE:*`,
    `Nome: ${g('f-nome')}`,
    `CPF: ${g('f-cpf')}`,
    `WhatsApp: ${g('f-tel')}`,
    g('f-email') ? `E-mail: ${g('f-email')}` : '',
    ``,
    `*ENTREGA:*`,
    `${g('f-rua')}, ${g('f-num')}${comp}`,
    `${g('f-bairro')} — ${g('f-cidade')}/${g('f-uf')}`,
    `CEP: ${g('f-cep')}`,
    g('f-obs') ? `\nObs: ${g('f-obs')}` : '',
    `━━━━━━━━━━━━`,
    `_Rize™ — Drop 001_`,
  ].filter(l => l !== '').join('\n');
}

/* ========================
   INIT
   ======================== */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();

  // Header scroll
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  renderCartPage();
  window.addEventListener('cart:update', renderCartPage);

  initMasks();

  document.getElementById('cepBtn')?.addEventListener('click', lookupCEP);

  document.getElementById('waBtn')?.addEventListener('click', () => {
    if (!validate()) return;
    const msg = buildMessage();
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
});
