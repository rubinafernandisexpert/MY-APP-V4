/* ---------------------------------------------------------------------------
   Bridges the storefront to the server.

   1. Adds a "Sign in / My library" link to the header.
   2. Intercepts the cart's Checkout button: when the visitor is signed in the
      cart is claimed server-side and they land on /library; when they are not,
      they are sent to /login and returned here afterwards.

   Everything degrades quietly on a static host (file://, GitHub Pages, Netlify):
   fetch simply fails and the storefront keeps its local demo behaviour.
   --------------------------------------------------------------------------- */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;

  var csrf = (document.cookie.match(/(?:^|;\s*)brio_csrf=([^;]+)/) || [])[1] || '';

  function api(path, opts) {
    opts = opts || {};
    return fetch(path, {
      method: opts.method || 'GET',
      credentials: 'same-origin',
      headers: Object.assign(
        { Accept: 'application/json' },
        opts.body ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}
      ),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        return { status: r.status, ok: r.ok, json: j };
      });
    });
  }

  /* ---- header link ----------------------------------------------------- */
  function authLink(user) {
    if (document.getElementById('brioAuthLink')) return;
    var host = document.getElementById('siteHeader');
    if (!host) return;

    var style = document.createElement('style');
    style.textContent =
      '.brio-auth{display:inline-flex;align-items:center;gap:6px;margin-left:10px;padding:8px 14px;' +
      'border-radius:999px;font:600 13px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
      'text-decoration:none;color:#22103a;background:linear-gradient(90deg,#FFD23D,#00E28A);' +
      'box-shadow:0 6px 18px rgba(124,92,255,.22);white-space:nowrap}' +
      '.brio-auth:hover{transform:translateY(-1px)}';
    document.head.appendChild(style);

    var a = document.createElement('a');
    a.id = 'brioAuthLink';
    a.className = 'brio-auth';
    a.href = user ? '/library' : '/login';
    a.textContent = user ? '📚 ' + user.name.split(' ')[0] + '’s library' : 'Sign in';
    host.appendChild(a);
  }

  /* ---- cart contents --------------------------------------------------- */
  function cartTitles() {
    var titles = [];
    var candidates = [window.BRIO_STORE, window.Store, window.brioStore, window.BRIO].filter(Boolean);
    candidates.forEach(function (s) {
      try {
        if (typeof s.cartBooks === 'function') {
          s.cartBooks().forEach(function (b) { if (b && b.title) titles.push(String(b.title)); });
        } else if (Array.isArray(s.cart)) {
          s.cart.forEach(function (b) {
            var t = typeof b === 'string' ? b : (b && b.title);
            if (t) titles.push(String(t));
          });
        }
      } catch (e) { /* ignore */ }
    });
    if (!titles.length) {
      /* DOM fallback: the drawer renders each line item's title in <b> */
      var nodes = document.querySelectorAll('#drawer b, #drawer [data-title], #cart [data-title]');
      Array.prototype.forEach.call(nodes, function (el) {
        var t = (el.getAttribute && el.getAttribute('data-title')) || el.textContent || '';
        t = t.trim();
        if (t && titles.indexOf(t) === -1) titles.push(t);
      });
    }
    return titles.filter(function (t, i, arr) { return t.length > 2 && arr.indexOf(t) === i; });
  }

  function toast(text) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var d = document.createElement('div');
    d.className = 'toast';
    d.setAttribute('role', 'status');
    d.textContent = text;
    box.appendChild(d);
    setTimeout(function () { d.remove(); }, 5000);
  }

  /* ---- checkout interception ------------------------------------------ */
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('button, a') : null;
    if (!el) return;
    var label = (el.textContent || '').toLowerCase();
    if (label.indexOf('checkout') === -1) return;

    ev.preventDefault();
    ev.stopPropagation();

    var titles = cartTitles();
    if (!titles.length) { toast('Your cart is empty.'); return; }
    toast('Saving your cart…');

    api('/api/library/claim', { method: 'POST', body: { titles: titles } }).then(function (res) {
      if (res.status === 401) {
        location.href = '/login?next=' + encodeURIComponent('/');
        return;
      }
      if (!res.ok) { toast('Could not save your cart. Please try again.'); return; }
      var added = (res.json.added || []).length;
      var owned = (res.json.alreadyOwned || []).length;
      if (window.BRIO_STORE && typeof window.BRIO_STORE.clear === 'function') { try { window.BRIO_STORE.clear(); } catch (e) {} }
      if (window.Store && typeof window.Store.clear === 'function') { try { window.Store.clear(); } catch (e) {} }
      toast(added + ' added · ' + owned + ' already yours — opening your library…');
      setTimeout(function () { location.href = '/library?added=' + added + '&owned=' + owned; }, 800);
    }).catch(function () {
      toast('Server not reachable — keeping the local demo.');
    });
  }, true);

  /* ---- who am I -------------------------------------------------------- */
  api('/api/me').then(function (res) {
    var user = res.ok && res.json && res.json.user ? res.json.user : null;
    if (user && user.csrf) csrf = user.csrf;
    authLink(user);
  }).catch(function () { /* static host — no link, no interception */ });
})();
