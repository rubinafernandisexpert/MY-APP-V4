/* =========================================================================
   Brio — store logic (cart + personal library + capture + checkout placeholder)
   Everything persists in localStorage. Every point that must become a server
   call in production is marked  >>> SERVER.
   Security notes:
     - no eval / new Function anywhere
     - every piece of data rendered through esc() before it reaches innerHTML
     - the checkout is a clearly labelled placeholder: no fake payment, no
       card fields, no claim that money changed hands
   ========================================================================= */
(function () {
  "use strict";

  var CART_KEY = "brio.cart.v2";
  var LIB_KEY = "brio.library.v2";
  var MAIL_KEY = "brio.mail.v2";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function money(n) { return "$" + Number(n || 0).toFixed(2).replace(/\.00$/, ""); }
  function read(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || "null");
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { App.toast("Storage is full — clear a little site data and try again."); return false; }
  }

  var Store = {
    /* >>> SERVER: cart lives in the session; the price must be re-read from the
       database on the server at checkout, never trusted from the browser. */
    cart: function () {
      var ids = read(CART_KEY, []);
      return Array.isArray(ids) ? ids.filter(function (x) { return typeof x === "string"; }) : [];
    },
    setCart: function (ids) {
      var clean = Array.from(new Set(ids)).slice(0, 200);
      write(CART_KEY, clean);
      App.renderCartBadge();
      return clean;
    },
    inCart: function (id) { return Store.cart().indexOf(id) > -1; },
    addToCart: function (id) {
      var c = Store.cart();
      if (c.indexOf(id) < 0) c.push(id);
      return Store.setCart(c);
    },
    removeFromCart: function (id) {
      return Store.setCart(Store.cart().filter(function (x) { return x !== id; }));
    },
    clearCart: function () { return Store.setCart([]); },
    cartBooks: function () {
      return Store.cart().map(function (id) { return Catalog.byId(id); }).filter(Boolean);
    },
    cartTotal: function () {
      return Store.cartBooks().reduce(function (s, b) { return s + Number(b.price); }, 0);
    },

    /* >>> SERVER: the library is the entitlement table. It must be written by a
       verified payment webhook, and the ebook/audio bytes must be streamed only
       after the server checks this row for the signed-in user. */
    library: function () {
      var ids = read(LIB_KEY, []);
      return Array.isArray(ids) ? ids.filter(function (x) { return typeof x === "string"; }) : [];
    },
    setLibrary: function (ids) { write(LIB_KEY, Array.from(new Set(ids))); return Store.library(); },
    owns: function (id) { return Store.library().indexOf(id) > -1; },
    libraryBooks: function () {
      return Store.library().map(function (id) { return Catalog.byId(id); }).filter(Boolean);
    },
    grantFromCart: function () {
      var lib = Store.library(), add = Store.cart();
      Store.setLibrary(lib.concat(add));
      Store.clearCart();
      return add.length;
    },
    subscribers: function () { return read(MAIL_KEY, []); },
    addSubscriber: function (email, consent) {
      var list = Store.subscribers();
      var row = { email: String(email).slice(0, 160), consent: !!consent, at: new Date().toISOString() };
      var i = -1;
      list.forEach(function (s, idx) { if (s.email === row.email) i = idx; });
      if (i > -1) list[i] = row; else list.push(row);
      write(MAIL_KEY, list);
      return list.length;
    }
  };

  var Catalog = {
    cats: function () { return window.BRIO_CATS || []; },
    ebooks: function () { return window.BRIO_EBOOKS || []; },
    articles: function () { return window.BRIO_ARTICLES || []; },
    cat: function (id) { return Catalog.cats().filter(function (c) { return c.id === id; })[0] || null; },
    byId: function (id) { return Catalog.ebooks().filter(function (b) { return b.id === id; })[0] || null; },
    counts: function () {
      var out = {};
      Catalog.ebooks().forEach(function (b) { out[b.cat] = (out[b.cat] || 0) + 1; });
      return out;
    },
    search: function (q) {
      q = String(q || "").trim().toLowerCase();
      if (!q) return Catalog.ebooks();
      var words = q.split(/\s+/).filter(Boolean);
      return Catalog.ebooks().filter(function (b) {
        var hay = [b.title, b.sub, b.about, b.catName, (b.outcomes || []).join(" ")].join(" ").toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) > -1; });
      });
    }
  };

  window.Brio = { Store: Store, Catalog: Catalog, esc: esc, money: money };
})();
