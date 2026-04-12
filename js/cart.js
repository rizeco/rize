'use strict';

const Cart = (() => {
  const KEY = 'rize_cart_v3';
  let items = _load();

  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }

  function _save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); }
    catch (e) { console.warn('Cart save failed', e); }
  }

  function _emit() {
    window.dispatchEvent(new CustomEvent('cart:update'));
  }

  function add(product, size, qty = 1) {
    qty = Math.max(1, parseInt(qty) || 1);
    const lineId = `${product.id}--${size}`;
    const existing = items.find(i => i.lineId === lineId);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 10);
    } else {
      items.push({ lineId, productId: product.id, name: product.name, variant: product.variant, size, price: product.price, image: product.image, qty });
    }
    _save(); _emit();
  }

  function remove(lineId) {
    items = items.filter(i => i.lineId !== lineId);
    _save(); _emit();
  }

  function setQty(lineId, qty) {
    qty = parseInt(qty);
    if (qty < 1) { remove(lineId); return; }
    const item = items.find(i => i.lineId === lineId);
    if (item) item.qty = Math.min(qty, 10);
    _save(); _emit();
  }

  function getItems()  { return [...items]; }
  function getCount()  { return items.reduce((n, i) => n + i.qty, 0); }
  function getTotal()  { return items.reduce((s, i) => s + i.price * i.qty, 0); }

  return { add, remove, setQty, getItems, getCount, getTotal };
})();
