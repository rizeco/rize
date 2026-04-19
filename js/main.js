/* ==========================================
   RIZE™ DROP 001 — MAIN JS v2
   Cart · Checkout · CEP · WhatsApp
   ========================================== */

const WHATSAPP_NUMBER = '5548999999999'; // <- trocar pelo número real

/* ============ STATE ============ */
let cart = [];

/* ============ GALLERY SWITCHER ============ */
document.querySelectorAll('.product-card__thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const target = parseInt(thumb.dataset.target);
    const card = thumb.closest('.product-card');
    card.querySelectorAll('.product-card__thumb').forEach(t => t.classList.remove('product-card__thumb--active'));
    thumb.classList.add('product-card__thumb--active');
    card.querySelectorAll('.product-card__img').forEach(img => img.classList.remove('product-card__img--active'));
    card.querySelector(`.product-card__img[data-idx="${target}"]`).classList.add('product-card__img--active');
  });
});

/* ============ SIZE SELECTOR ============ */
document.querySelectorAll('.size-selector').forEach(selector => {
  selector.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selector.querySelectorAll('.size-btn').forEach(b => b.classList.remove('size-btn--active'));
      btn.classList.add('size-btn--active');
    });
  });
});

/* ============ QUANTITY SELECTOR ============ */
document.querySelectorAll('.product-card').forEach(card => {
  const minus = card.querySelector('.qty-btn--minus');
  const plus = card.querySelector('.qty-btn--plus');
  const valueEl = card.querySelector('.qty-value');
  let qty = 1;
  minus.addEventListener('click', () => { if (qty > 1) { qty--; valueEl.textContent = qty; } });
  plus.addEventListener('click', () => { qty++; valueEl.textContent = qty; });
});

/* ============ ADD TO CART ============ */
document.querySelectorAll('.product-card__add').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    const productName = btn.dataset.productName;
    const price = parseFloat(btn.dataset.productPrice);
    const size = card.querySelector('.size-btn--active')?.dataset.size || 'G';
    const qty = parseInt(card.querySelector('.qty-value').textContent);
    const imgSrc = card.querySelector('.product-card__img--active')?.src || '';

    // Check if item already exists (same name + size)
    const key = `${productName}-${size}`;
    const existing = cart.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ key, name: productName, size, qty, price, img: imgSrc });
    }

    renderCart();
    openCart();
    animateCartBtn();
  });
});

/* ============ RENDER CART ============ */
function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = totalItems;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-drawer__empty">Seu carrinho está vazio.</p>';
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'flex';
  let total = 0;

  itemsEl.innerHTML = cart.map((item, idx) => {
    total += item.price * item.qty;
    return `
      <div class="cart-item">
        <img class="cart-item__img" src="${item.img}" alt="${item.name}">
        <div class="cart-item__info">
          <span class="cart-item__name">${item.name}</span>
          <span class="cart-item__meta">Tam: ${item.size} · Qtd: ${item.qty}</span>
          <span class="cart-item__price">R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
        </div>
        <button class="cart-item__remove" data-idx="${idx}" title="Remover">✕</button>
      </div>
    `;
  }).join('');

  totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

  // Remove buttons
  itemsEl.querySelectorAll('.cart-item__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.splice(parseInt(btn.dataset.idx), 1);
      renderCart();
    });
  });
}

/* ============ CART DRAWER TOGGLE ============ */
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('cartToggle').addEventListener('click', () => {
  if (cartDrawer.classList.contains('open')) closeCart(); else openCart();
});
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function animateCartBtn() {
  const btn = document.getElementById('cartToggle');
  btn.style.transform = 'scale(1.2)';
  setTimeout(() => { btn.style.transform = ''; }, 180);
}

/* ============ CHECKOUT MODAL ============ */
const checkoutModal = document.getElementById('checkoutModal');
const checkoutOverlay = document.getElementById('checkoutOverlay');

function openCheckout() {
  if (cart.length === 0) return;
  renderCheckoutSummary();
  closeCart();
  checkoutModal.classList.add('open');
  checkoutOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCheckout() {
  checkoutModal.classList.remove('open');
  checkoutOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
document.getElementById('checkoutOverlay').addEventListener('click', closeCheckout);

function renderCheckoutSummary() {
  const el = document.getElementById('checkoutSummary');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  el.innerHTML = `
    <p class="checkout-summary__title">Resumo do pedido</p>
    ${cart.map(i => `
      <div class="checkout-summary__item">
        <span>${i.name} · Tam: ${i.size} · Qtd: ${i.qty}</span>
        <span>R$ ${(i.price * i.qty).toFixed(2).replace('.', ',')}</span>
      </div>
    `).join('')}
    <div class="checkout-summary__total">
      <span>Total</span>
      <span>R$ ${total.toFixed(2).replace('.', ',')}</span>
    </div>
  `;
}

/* ============ CEP LOOKUP ============ */
const cepInput = document.getElementById('fieldCep');

cepInput.addEventListener('input', () => {
  let v = cepInput.value.replace(/\D/g, '');
  if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
  cepInput.value = v;
});

document.getElementById('cepBtn').addEventListener('click', fetchCep);
cepInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fetchCep(); } });

async function fetchCep() {
  const cep = cepInput.value.replace(/\D/g, '');
  if (cep.length !== 8) { alert('CEP inválido. Digite 8 números.'); return; }

  const btn = document.getElementById('cepBtn');
  btn.textContent = '...';
  btn.disabled = true;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (data.erro) { alert('CEP não encontrado.'); return; }

    document.getElementById('fieldRua').value = data.logradouro || '';
    document.getElementById('fieldBairro').value = data.bairro || '';
    document.getElementById('fieldCidade').value = data.localidade || '';
    document.getElementById('fieldUf').value = data.uf || '';
    document.getElementById('fieldNumero').focus();
  } catch {
    alert('Erro ao buscar CEP. Tente novamente.');
  } finally {
    btn.textContent = 'Buscar';
    btn.disabled = false;
  }
}

/* ============ CPF MASK ============ */
document.getElementById('fieldCpf').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '');
  if (v.length > 3) v = v.slice(0, 3) + '.' + v.slice(3);
  if (v.length > 7) v = v.slice(0, 7) + '.' + v.slice(7);
  if (v.length > 11) v = v.slice(0, 11) + '-' + v.slice(11, 13);
  this.value = v;
});

/* ============ WHATSAPP PHONE MASK ============ */
document.getElementById('fieldWhatsapp').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '');
  if (v.length > 0) v = '(' + v;
  if (v.length > 3) v = v.slice(0, 3) + ') ' + v.slice(3);
  if (v.length > 10) v = v.slice(0, 10) + '-' + v.slice(10, 15);
  this.value = v;
});

/* ============ CHECKOUT SUBMIT ============ */
document.getElementById('checkoutForm').addEventListener('submit', e => {
  e.preventDefault();

  const nome = document.getElementById('fieldNome').value.trim();
  const whatsapp = document.getElementById('fieldWhatsapp').value.trim();
  const email = document.getElementById('fieldEmail').value.trim();
  const cpf = document.getElementById('fieldCpf').value.trim();
  const cep = document.getElementById('fieldCep').value.trim();
  const rua = document.getElementById('fieldRua').value.trim();
  const numero = document.getElementById('fieldNumero').value.trim();
  const complemento = document.getElementById('fieldComplemento').value.trim();
  const bairro = document.getElementById('fieldBairro').value.trim();
  const cidade = document.getElementById('fieldCidade').value.trim();
  const uf = document.getElementById('fieldUf').value.trim();
  const obs = document.getElementById('fieldObs').value.trim();

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const pedidoLinhas = cart.map(i =>
    `  • ${i.name} | Tam: ${i.size} | Qtd: ${i.qty} | R$ ${(i.price * i.qty).toFixed(2).replace('.', ',')}`
  ).join('\n');

  const enderecoCompleto = [rua, numero, complemento, bairro, cidade, uf, cep].filter(Boolean).join(', ');

  const msg = [
    '🛒 *NOVO PEDIDO — RIZE™ Drop 001*',
    '',
    '👤 *DADOS DO CLIENTE*',
    `Nome: ${nome}`,
    `WhatsApp: ${whatsapp}`,
    email ? `E-mail: ${email}` : null,
    `CPF: ${cpf}`,
    '',
    '📦 *ITENS DO PEDIDO*',
    pedidoLinhas,
    '',
    `💰 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*`,
    '',
    '📍 *ENDEREÇO DE ENTREGA*',
    enderecoCompleto,
    obs ? `\n📝 *Obs:* ${obs}` : null,
    '',
    '_Pedido enviado via site Rize™_',
  ].filter(l => l !== null).join('\n');

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');

  // Reset cart after send
  setTimeout(() => {
    cart = [];
    renderCart();
    closeCheckout();
    document.getElementById('checkoutForm').reset();
  }, 800);
});

/* ============ SCROLL REVEAL ============ */
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
revealEls.forEach(el => observer.observe(el));

/* ============ NAV SCROLL ============ */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.style.borderBottomColor = window.scrollY > 60
    ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)';
});
