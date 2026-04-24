/* =============================================================
   RIZE™ LANDING — js/main.js (Firebase-driven)
   Lê TUDO do Firestore: textos, preços, estoque, configurações
   ============================================================= */

import { initializeApp }    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, doc, collection, addDoc, onSnapshot,
         writeBatch, increment, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCy0dxrlthuRpidkv2XEZTlD8fx0RZXiF8",
  authDomain:        "system-rize.firebaseapp.com",
  projectId:         "system-rize",
  storageBucket:     "system-rize.firebasestorage.app",
  messagingSenderId: "1021973532313",
  appId:             "1:1021973532313:web:884a246199999f659e3208",
};

const app = initializeApp(FIREBASE_CONFIG);
const db  = getFirestore(app);

let _config  = {};
let _produtos = {};
let carrinho  = [];

document.addEventListener("DOMContentLoaded", () => {
  iniciarRealtime();
  iniciarGaleria();
  iniciarTamanhos();
  iniciarQuantidade();
  iniciarCarrinho();
  iniciarCheckout();
  iniciarScrollEffects();
});

function iniciarRealtime() {
  onSnapshot(doc(db, "landing_config", "main"), (snap) => {
    if (!snap.exists()) return;
    _config = snap.data();
    aplicarConfig(_config);
  });
  onSnapshot(collection(db, "products"), (snap) => {
    snap.docs.forEach(d => { _produtos[d.id] = { id: d.id, ...d.data() }; });
    atualizarEstoqueLanding();
  });
}

function aplicarConfig(c) {
  if (c.titulo) document.title = c.titulo;
  const setText = (sel, v) => { if (!v) return; const el = document.querySelector("[data-lp=\"" + sel + "\"]"); if (el) el.textContent = v; };
  setText("hero-linha1",    c.heroLinha1);
  setText("hero-linha2",    c.heroLinha2);
  setText("hero-sub",       c.heroSub);
  setText("hero-eyebrow",   c.heroEyebrow);
  setText("brand-headline", c.brandHeadline);
  setText("brand-texto1",   c.brandTexto1);
  setText("brand-texto2",   c.brandTexto2);
  setText("prod-eyebrow",   c.prodEyebrow);
  setText("prod-h1",        c.prodH1);
  setText("prod-h2",        c.prodH2);
  setText("banner-eyebrow",  c.bannerEyebrow);
  setText("banner-headline", c.bannerHeadline);
  setText("banner-notice",   c.bannerNotice);
  setText("banner-sub",      c.bannerSub);
  setText("vip-headline",    c.vipHeadline);
  setText("vip-b1",          c.vipB1);
  setText("vip-b2",          c.vipB2);
  setText("vip-b3",          c.vipB3);
  setText("vip-disclaimer",  c.vipDisclaimer);
  setText("footer-copy",     c.footerCopy);
  setText("footer-tagline",  c.footerTagline);

  const setCard = (sel, nome, cor, preco, specs, notice, id) => {
    const card = document.querySelector(sel);
    if (!card) return;
    const nameEl = card.querySelector(".product-card__name"); if (nameEl && nome) nameEl.innerHTML = nome + "<br><span>" + (cor||"") + "</span>";
    const priceEl = card.querySelector(".product-card__price"); if (priceEl && preco) priceEl.textContent = "R$ " + Number(preco).toFixed(2).replace(".", ",");
    const specsEl = card.querySelector(".product-card__specs"); if (specsEl && specs) specsEl.textContent = specs;
    const noticeEl = card.querySelector(".product-card__notice"); if (noticeEl && notice) noticeEl.textContent = notice;
    const addBtn = card.querySelector(".product-card__add");
    if (addBtn) {
      if (nome) addBtn.dataset.productName = nome;
      if (preco) addBtn.dataset.productPrice = preco;
      if (id) addBtn.dataset.productId = id;
    }
  };
  setCard("[data-product=\"black\"]", c.p1Nome, c.p1Cor, c.p1Preco, c.p1Specs, c.p1Notice, c.p1Id);
  setCard("[data-product=\"white\"]", c.p2Nome, c.p2Cor, c.p2Preco, c.p2Specs, c.p2Notice, c.p2Id);

  if (c.vipWhatsapp) {
    const vipLink = document.querySelector(".vip-whatsapp-link");
    if (vipLink) vipLink.href = "https://wa.me/" + c.vipWhatsapp + "?text=Quero+entrar+no+grupo+VIP+da+Rize";
  }

  if (c.marqueeItens) {
    const track = document.querySelector(".marquee__track");
    if (track) {
      const items = c.marqueeItens.split("|").map(s => s.trim()).filter(Boolean);
      const doubled = [...items, ...items];
      track.innerHTML = doubled.map(item => "<span class=\"marquee__item\">" + item + " <span class=\"marquee__dot\"></span></span>").join("");
    }
  }
}

function atualizarEstoqueLanding() {
  const mapa = { black: _config.p1Id, white: _config.p2Id };
  Object.entries(mapa).forEach(([chave, prodId]) => {
    if (!prodId) return;
    const produto = _produtos[prodId];
    if (!produto) return;
    const card  = document.querySelector(".product-card[data-product=\"" + chave + "\"]");
    if (!card) return;
    const sizes = produto.sizes || {};
    const total = Object.values(sizes).reduce((s, v) => s + (Number(v)||0), 0);
    card.querySelectorAll(".size-btn").forEach(btn => {
      const tam = btn.dataset.size, stock = Number(sizes[tam])||0;
      btn.disabled = stock === 0;
      btn.title    = stock === 0 ? "Esgotado" : stock + " disponível";
      btn.classList.toggle("size-btn--out", stock === 0);
      if (stock === 0) btn.classList.remove("size-btn--active");
    });
    let badge = card.querySelector(".stock-badge");
    if (!badge) { badge = document.createElement("div"); badge.className = "stock-badge"; card.querySelector(".product-card__info")?.prepend(badge); }
    if (total === 0) { badge.textContent = "ESGOTADO"; badge.dataset.tipo = "out"; const b = card.querySelector(".product-card__add"); if (b) { b.disabled = true; b.textContent = "Esgotado"; } }
    else if (total <= 5) { badge.textContent = "⚡ ÚLTIMAS " + total + " UNIDADES"; badge.dataset.tipo = "low"; }
    else { badge.textContent = ""; badge.dataset.tipo = ""; }
  });
}

function iniciarGaleria() {
  document.querySelectorAll(".product-card__thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const idx = parseInt(thumb.dataset.target), card = thumb.closest(".product-card");
      card.querySelectorAll(".product-card__thumb").forEach(t => t.classList.remove("product-card__thumb--active"));
      thumb.classList.add("product-card__thumb--active");
      card.querySelectorAll(".product-card__img").forEach(img => img.classList.remove("product-card__img--active"));
      card.querySelector(".product-card__img[data-idx=\"" + idx + "\"]")?.classList.add("product-card__img--active");
    });
  });
}

function iniciarTamanhos() {
  document.querySelectorAll(".size-selector").forEach(sel => {
    sel.querySelectorAll(".size-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        sel.querySelectorAll(".size-btn").forEach(b => b.classList.remove("size-btn--active"));
        btn.classList.add("size-btn--active");
      });
    });
  });
}

function iniciarQuantidade() {
  document.querySelectorAll(".product-card").forEach(card => {
    let qty = 1; const el = card.querySelector(".qty-value");
    card.querySelector(".qty-btn--minus")?.addEventListener("click", () => { if (qty > 1) el.textContent = --qty; });
    card.querySelector(".qty-btn--plus")?.addEventListener("click",  () => { el.textContent = ++qty; });
  });
}

function iniciarCarrinho() {
  document.querySelectorAll(".product-card__add").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      const card = btn.closest(".product-card");
      const chave = card.dataset.product;
      const nome  = btn.dataset.productName || "Produto";
      const preco = parseFloat(btn.dataset.productPrice) || 0;
      const prodId = btn.dataset.productId || chave;
      const tamBtn = card.querySelector(".size-btn--active");
      const qty   = parseInt(card.querySelector(".qty-value")?.textContent || "1");
      const img   = card.querySelector(".product-card__img--active")?.src || "";
      if (!tamBtn) { toast("Selecione um tamanho!"); return; }
      const tam = tamBtn.dataset.size;
      const produto = _produtos[prodId];
      const disponivel = Number(produto?.sizes?.[tam] ?? 999);
      const noCarrinho = carrinho.find(i => i.prodId === prodId && i.tam === tam)?.qty || 0;
      if (noCarrinho + qty > disponivel) { toast("Estoque insuficiente. Disponível: " + (disponivel - noCarrinho)); return; }
      const key = prodId + "-" + tam, existing = carrinho.find(i => i.key === key);
      if (existing) existing.qty += qty;
      else carrinho.push({ key, chave, prodId, nome, tam, qty, preco, img });
      renderCarrinho(); abrirCarrinho(); pulsoCarrinho();
    });
  });
  document.getElementById("cartToggle")?.addEventListener("click", () =>
    document.getElementById("cartDrawer")?.classList.contains("open") ? fecharCarrinho() : abrirCarrinho());
  document.getElementById("cartClose")?.addEventListener("click", fecharCarrinho);
  document.getElementById("cartOverlay")?.addEventListener("click", fecharCarrinho);
  document.getElementById("checkoutBtn")?.addEventListener("click", abrirCheckout);
}

function renderCarrinho() {
  const itemsEl = document.getElementById("cartItems"), footerEl = document.getElementById("cartFooter"),
        totalEl = document.getElementById("cartTotal"), countEl  = document.getElementById("cartCount");
  if (!itemsEl) return;
  countEl.textContent = carrinho.reduce((s, i) => s + i.qty, 0);
  if (!carrinho.length) { itemsEl.innerHTML = "<p class=\"cart-drawer__empty\">Seu carrinho está vazio.</p>"; footerEl.style.display = "none"; return; }
  footerEl.style.display = "flex"; let total = 0;
  itemsEl.innerHTML = carrinho.map((item, idx) => { total += item.preco * item.qty; return "<div class=\"cart-item\"><img class=\"cart-item__img\" src=\"" + item.img + "\" alt=\"\">" + "<div class=\"cart-item__info\"><span class=\"cart-item__name\">" + item.nome + "</span><span class=\"cart-item__meta\">Tam: " + item.tam + " · Qtd: " + item.qty + "</span><span class=\"cart-item__price\">R$ " + (item.preco * item.qty).toFixed(2).replace(".", ",") + "</span></div><button class=\"cart-item__remove\" data-idx=\"" + idx + "\">✕</button></div>"; }).join("");
  totalEl.textContent = "R$ " + total.toFixed(2).replace(".", ",");
  itemsEl.querySelectorAll(".cart-item__remove").forEach(btn => { btn.addEventListener("click", () => { carrinho.splice(+btn.dataset.idx, 1); renderCarrinho(); }); });
}

function abrirCarrinho()  { document.getElementById("cartDrawer")?.classList.add("open"); document.getElementById("cartOverlay")?.classList.add("open"); document.body.style.overflow = "hidden"; }
function fecharCarrinho() { document.getElementById("cartDrawer")?.classList.remove("open"); document.getElementById("cartOverlay")?.classList.remove("open"); document.body.style.overflow = ""; }
function pulsoCarrinho()  { const b = document.getElementById("cartToggle"); if (!b) return; b.style.transform = "scale(1.2)"; setTimeout(() => b.style.transform = "", 180); }

function iniciarCheckout() {
  document.getElementById("checkoutClose")?.addEventListener("click", fecharCheckout);
  document.getElementById("checkoutOverlay")?.addEventListener("click", fecharCheckout);
  const cepEl = document.getElementById("fieldCep");
  cepEl?.addEventListener("input", () => { let v = cepEl.value.replace(/\D/g,""); if (v.length > 5) v = v.slice(0,5)+"-"+v.slice(5,8); cepEl.value = v; });
  document.getElementById("cepBtn")?.addEventListener("click", buscarCEP);
  cepEl?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); buscarCEP(); } });
  document.getElementById("fieldCpf")?.addEventListener("input", function() { let v = this.value.replace(/\D/g,""); if (v.length>3) v=v.slice(0,3)+"."+v.slice(3); if (v.length>7) v=v.slice(0,7)+"."+v.slice(7); if (v.length>11) v=v.slice(0,11)+"-"+v.slice(11,13); this.value=v; });
  document.getElementById("fieldWhatsapp")?.addEventListener("input", function() { let v = this.value.replace(/\D/g,""); if (v.length>0) v="("+v; if (v.length>3) v=v.slice(0,3)+") "+v.slice(3); if (v.length>10) v=v.slice(0,10)+"-"+v.slice(10,15); this.value=v; });
  document.getElementById("checkoutForm")?.addEventListener("submit", finalizarPedido);
}

function abrirCheckout() {
  if (!carrinho.length) return;
  const el = document.getElementById("checkoutSummary"); if (!el) return;
  const frete = Number(_config.frete)||9.90, subtotal = carrinho.reduce((s,i)=>s+i.preco*i.qty,0);
  el.innerHTML = "<p class=\"checkout-summary__title\">Resumo do pedido</p>" + carrinho.map(i=>"<div class=\"checkout-summary__item\"><span>"+i.nome+" · Tam: "+i.tam+" · Qtd: "+i.qty+"</span><span>R$ "+(i.preco*i.qty).toFixed(2).replace(".",",")+"</span></div>").join("") + "<div class=\"checkout-summary__item\" style=\"opacity:.65\"><span>Frete</span><span>R$ "+frete.toFixed(2).replace(".",",")+"</span></div><div class=\"checkout-summary__total\"><span>Total</span><span>R$ "+(subtotal+frete).toFixed(2).replace(".",",")+"</span></div>";
  fecharCarrinho();
  document.getElementById("checkoutModal")?.classList.add("open");
  document.getElementById("checkoutOverlay")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function fecharCheckout() { document.getElementById("checkoutModal")?.classList.remove("open"); document.getElementById("checkoutOverlay")?.classList.remove("open"); document.body.style.overflow = ""; }

async function buscarCEP() {
  const cep = document.getElementById("fieldCep")?.value.replace(/\D/g,"");
  if (cep?.length !== 8) { alert("CEP inválido."); return; }
  const btn = document.getElementById("cepBtn"); btn.textContent="..."; btn.disabled=true;
  try { const r=await fetch("https://viacep.com.br/ws/"+cep+"/json/"),d=await r.json(); if (!d.erro) { document.getElementById("fieldRua").value=d.logradouro||""; document.getElementById("fieldBairro").value=d.bairro||""; document.getElementById("fieldCidade").value=d.localidade||""; document.getElementById("fieldUf").value=d.uf||""; document.getElementById("fieldNumero")?.focus(); } else alert("CEP não encontrado."); } catch { alert("Erro ao buscar CEP."); } finally { btn.textContent="Buscar"; btn.disabled=false; }
}

async function finalizarPedido(e) {
  e.preventDefault();
  const g = id => document.getElementById(id)?.value.trim()||"";
  const frete = Number(_config.frete)||9.90, subtotal = carrinho.reduce((s,i)=>s+i.preco*i.qty,0), total = subtotal+frete;
  const whatsapp = _config.checkoutWhatsapp||"5548999999999";
  const btn = document.querySelector(".checkout-form__submit"); btn.textContent="Registrando..."; btn.disabled=true;
  let pedidoId = null;
  try {
    const ref = await addDoc(collection(db,"orders"), { customerName:g("fieldNome"), customerPhone:g("fieldWhatsapp"), customerEmail:g("fieldEmail"), cpf:g("fieldCpf"), address:{rua:g("fieldRua"),numero:g("fieldNumero"),complemento:g("fieldComplemento"),bairro:g("fieldBairro"),cidade:g("fieldCidade"),uf:g("fieldUf"),cep:g("fieldCep")}, items:carrinho.map(i=>({productId:i.prodId,productName:i.nome,size:i.tam,qty:i.qty,price:i.preco})), shipping:frete, total, notes:g("fieldObs"), status:"pending", createdAt:serverTimestamp() });
    pedidoId = ref.id;
    const batch = writeBatch(db);
    carrinho.forEach(item => { if (item.prodId && !item.prodId.startsWith("COLE")) batch.update(doc(db,"products",item.prodId),{["sizes."+item.tam]:increment(-item.qty)}); });
    await batch.commit();
  } catch(err) { console.warn("Firebase:", err.message); }
  const linhas = carrinho.map(i=>"  • "+i.nome+" | Tam: "+i.tam+" | Qtd: "+i.qty+" | R$ "+(i.preco*i.qty).toFixed(2).replace(".",",")).join("\n");
  const endereco = [g("fieldRua"),g("fieldNumero"),g("fieldComplemento"),g("fieldBairro"),g("fieldCidade"),g("fieldUf"),g("fieldCep")].filter(Boolean).join(", ");
  const obs = g("fieldObs");
  const msg = ["🛒 *PEDIDO RIZE™*", pedidoId?"📋 ID: "+pedidoId:null, "", "👤 *CLIENTE*", "Nome: "+g("fieldNome"), "WhatsApp: "+g("fieldWhatsapp"), g("fieldEmail")?"E-mail: "+g("fieldEmail"):null, "CPF: "+g("fieldCpf"), "", "📦 *ITENS*", linhas, "", "🚚 Frete: R$ "+frete.toFixed(2).replace(".",","), "💰 *TOTAL: R$ "+total.toFixed(2).replace(".",",")+  "*", "", "📍 *ENDEREÇO*", endereco, obs?"\n📝 Obs: "+obs:null].filter(l=>l!==null).join("\n");
  window.open("https://wa.me/"+whatsapp+"?text="+encodeURIComponent(msg),"_blank");
  carrinho=[]; renderCarrinho(); fecharCheckout(); document.getElementById("checkoutForm")?.reset();
  btn.textContent="Enviar Pedido pelo WhatsApp"; btn.disabled=false;
  toast("Pedido enviado! Verifique o WhatsApp.");
}

function iniciarScrollEffects() {
  const nav = document.querySelector(".nav");
  window.addEventListener("scroll", () => { nav?.style.setProperty("border-bottom-color", window.scrollY>60?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.07)"); });
  const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }), { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
}

function toast(msg) {
  let el = document.getElementById("_toast");
  if (!el) { el = Object.assign(document.createElement("div"),{id:"_toast"}); Object.assign(el.style,{position:"fixed",bottom:"28px",left:"50%",transform:"translateX(-50%) translateY(12px)",background:"#fff",color:"#000",padding:"11px 22px",fontFamily:"'Space Mono',monospace",fontSize:"11px",zIndex:"9999",opacity:"0",transition:"all 0.3s",whiteSpace:"nowrap"}); document.body.appendChild(el); }
  el.textContent = msg; el.style.opacity="1"; el.style.transform="translateX(-50%) translateY(0)";
  setTimeout(() => { el.style.opacity="0"; el.style.transform="translateX(-50%) translateY(12px)"; }, 3500);
}
