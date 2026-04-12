'use strict';

/* ========================
   HEADER
   ======================== */
const Header = (() => {
  let open = false;

  function init() {
    const header = document.getElementById('header');
    const burger = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');

    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    burger?.addEventListener('click', () => {
      open = !open;
      burger.classList.toggle('open', open);
      mobileNav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });

    document.querySelectorAll('.header__mobile-link').forEach(l => {
      l.addEventListener('click', () => {
        open = false;
        burger?.classList.remove('open');
        mobileNav?.classList.remove('open');
      });
    });
  }

  return { init };
})();

/* ========================
   PRODUCTS
   ======================== */
const Products = (() => {
  function _html(p) {
    const chips = SIZES.map((s, i) =>
      `<button class="size-btn${i === 2 ? ' active' : ''}" data-size="${s}">${s}</button>`
    ).join('');

    return `
      <article class="product-card js-sr" data-id="${p.id}">
        <div class="product-card__img-wrap">
          <img src="${p.image}" alt="${p.name} — ${p.variant}" class="product-card__img" loading="lazy" />
          <span class="product-card__new">Drop 001</span>
        </div>
        <div class="product-card__body">
          <p class="product-card__name">${p.name}</p>
          <p class="product-card__variant">${p.variant}</p>
          <p class="product-card__desc">${p.desc}</p>
          <div class="size-row" role="group" aria-label="Tamanho">${chips}</div>
          <div class="product-card__footer">
            <span class="product-card__price">${fmtPrice(p.price)}</span>
            <div class="qty-ctrl" aria-label="Quantidade">
              <button class="qty-btn qty-minus" aria-label="−">−</button>
              <span class="qty-val" aria-live="polite">1</span>
              <button class="qty-btn qty-plus" aria-label="+">+</button>
            </div>
            <button class="add-btn" aria-label="Adicionar ao carrinho">Add</button>
          </div>
        </div>
      </article>`;
  }

  function _bind(card, product) {
    // Size chips
    card.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        card.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Qty
    const valEl = card.querySelector('.qty-val');
    let qty = 1;
    card.querySelector('.qty-minus').addEventListener('click', () => { if (qty > 1) valEl.textContent = --qty; });
    card.querySelector('.qty-plus').addEventListener('click', () => { if (qty < 10) valEl.textContent = ++qty; });

    // Add
    const addBtn = card.querySelector('.add-btn');
    addBtn.addEventListener('click', () => {
      const size = card.querySelector('.size-btn.active')?.dataset.size || 'G';
      Cart.add(product, size, qty);
      Toast.show(`${product.name} (${size}) — adicionado`);
      addBtn.textContent = '✓ OK';
      addBtn.classList.add('done');
      setTimeout(() => { addBtn.textContent = 'Add'; addBtn.classList.remove('done'); }, 2000);
    });
  }

  function render() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = RIZE_PRODUCTS.map(_html).join('');
    grid.querySelectorAll('.product-card').forEach(card => {
      const p = RIZE_PRODUCTS.find(p => p.id === card.dataset.id);
      if (p) _bind(card, p);
    });
  }

  return { render };
})();

/* ========================
   AUTO CAROUSEL
   ======================== */
const Carousel = (() => {
  const slides = [
    { src: 'assets/images/shirt-black.jpg',  label: 'The Eye — Preto' },
    { src: 'assets/images/shirt-white.jpg',  label: 'The Eye — Off-White' },
    { src: 'assets/images/shirt-black.jpg',  label: 'Drop 001' },
    { src: 'assets/images/shirt-white.jpg',  label: 'Drop 001' },
    { src: 'assets/images/shirt-black.jpg',  label: 'Rize™' },
    { src: 'assets/images/shirt-white.jpg',  label: 'Rize™' },
  ];

  function init() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    // Triple for seamless loop
    const all = [...slides, ...slides, ...slides];
    track.innerHTML = all.map(s => `
      <div class="carousel-slide">
        <img src="${s.src}" alt="${s.label}" loading="lazy" />
        <span class="carousel-slide__label">${s.label}</span>
      </div>`).join('');

    const cardW = 280 + 12; // width + gap
    const setW  = slides.length * cardW;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes rizeCarousel {
        from { transform: translateX(0); }
        to   { transform: translateX(-${setW}px); }
      }`;
    document.head.appendChild(style);

    track.style.cssText = `
      display:flex; gap:12px; will-change:transform;
      animation: rizeCarousel ${slides.length * 2.8}s linear infinite;
    `;

    const wrap = document.querySelector('.carousel-wrap');
    wrap?.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    wrap?.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
  }

  return { init };
})();

/* ========================
   CART DRAWER
   ======================== */
const CartDrawer = (() => {
  function _render() {
    const items   = Cart.getItems();
    const itemsEl = document.getElementById('drawerItems');
    const footer  = document.getElementById('drawerFooter');
    if (!itemsEl) return;

    if (!items.length) {
      itemsEl.innerHTML = '<p class="cart-drawer__empty">Seu carrinho está vazio.</p>';
      if (footer) footer.style.display = 'none';
      return;
    }

    itemsEl.innerHTML = items.map(item => `
      <div class="drawer-item">
        <img src="${item.image}" alt="${item.name}" class="drawer-item__img" />
        <div class="drawer-item__info">
          <p class="drawer-item__name">${item.name}</p>
          <p class="drawer-item__meta">${item.variant} · ${item.size} · ×${item.qty}</p>
          <button class="drawer-item__remove" data-line="${item.lineId}">Remover</button>
        </div>
        <span class="drawer-item__price">${fmtPrice(item.price * item.qty)}</span>
      </div>`).join('');

    itemsEl.querySelectorAll('.drawer-item__remove').forEach(btn => {
      btn.addEventListener('click', () => Cart.remove(btn.dataset.line));
    });

    if (footer) {
      footer.style.display = 'flex';
      footer.style.flexDirection = 'column';
      footer.style.gap = '10px';
    }
    const tot = document.getElementById('drawerTotal');
    if (tot) tot.textContent = fmtPrice(Cart.getTotal());
  }

  function _badge() {
    const el = document.getElementById('cartBadge');
    if (!el) return;
    const n = Cart.getCount();
    el.textContent = n;
    el.classList.toggle('show', n > 0);
  }

  function open()  {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('drawerOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    _render();
  }

  function close() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('drawerOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    document.getElementById('cartToggle')?.addEventListener('click', open);
    document.getElementById('cartClose')?.addEventListener('click', close);
    document.getElementById('drawerOverlay')?.addEventListener('click', close);
    window.addEventListener('cart:update', () => { _badge(); _render(); });
    _badge();
  }

  return { init };
})();

/* ========================
   ANIMATIONS
   ======================== */
const Animations = (() => {
  function _hero() {
    requestAnimationFrame(() => {
      document.querySelectorAll('.hero__line').forEach((el, i) => {
        setTimeout(() => el.classList.add('in'), 80 + i * 140);
      });
      document.querySelectorAll('.hero__sub, .hero__actions').forEach(el => {
        const d = parseFloat(el.style.getPropertyValue('--d') || '0.4') * 1000;
        setTimeout(() => el.classList.add('in'), d);
      });
      setTimeout(() => document.querySelector('.hero__visual')?.classList.add('in'), 200);
    });
  }

  function _scrollReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.js-sr').forEach(el => obs.observe(el));
  }

  function init() { _hero(); setTimeout(_scrollReveal, 80); }
  return { init };
})();

/* ========================
   VIP FORM
   ======================== */
const VIP = (() => {
  const WA_VIP = '5548999999999'; // 🔧 Substitua

  function init() {
    const btn = document.getElementById('vipBtn');
    const phoneInput = document.getElementById('vip-phone');

    phoneInput?.addEventListener('input', () => {
      phoneInput.value = fmtPhone(phoneInput.value);
    });

    btn?.addEventListener('click', () => {
      const name  = document.getElementById('vip-name')?.value.trim();
      const phone = phoneInput?.value.trim();

      if (!name)  { Toast.show('Informe seu nome.', 'error'); return; }
      if (!phone) { Toast.show('Informe seu WhatsApp.', 'error'); return; }

      const msg = `Quero entrar no grupo VIP da Rize™.\n\nNome: ${name}\nWhatsApp: ${phone}`;
      window.open(`https://wa.me/${WA_VIP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
      Toast.show('Redirecionando para WhatsApp...');
    });
  }

  return { init };
})();

/* ========================
   INIT
   ======================== */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Header.init();
  Products.render();
  Carousel.init();
  CartDrawer.init();
  Animations.init();
  VIP.init();
});
