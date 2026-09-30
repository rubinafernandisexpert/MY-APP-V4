/* =========================================================================
   Brio — page application
   Renders the 15 categories, the human-written ebook shelf, the free articles, the cart
   drawer, the personal-library state and the scroll reveals.
   Reveal rule: anything at or above the fold is revealed immediately, so a
   card can never be left invisible waiting for an observer.
   ========================================================================= */
(function () {
  "use strict";

  var S = window.Brio.Store, C = window.Brio.Catalog, esc = window.Brio.esc, money = window.Brio.money;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var state = { cat: "all", q: "" };

  /* ------------------------------------------------------------------ toasts */
  var App = {
    toast: function (msg) {
      var host = $("#toasts");
      if (!host) return;
      var t = document.createElement("div");
      t.className = "toast";
      t.textContent = msg;
      host.appendChild(t);
      setTimeout(function () {
        t.style.transition = "opacity .3s, transform .3s";
        t.style.opacity = "0";
        t.style.transform = "translateY(8px)";
        setTimeout(function () { t.remove(); }, 320);
      }, 2600);
    },
    renderCartBadge: function () {
      var n = S.cart().length, b = $("#cartBadge");
      if (!b) return;
      b.textContent = String(n);
      b.hidden = n === 0;
    }
  };
  window.App = App;

  /* ------------------------------------------------------------------ reveal */
  var io = null, rafId = 0;
  function sweep() {
    var vh = window.innerHeight;
    $$(".reveal").forEach(function (el) {
      if (el.classList.contains("in")) return;
      if (el.getBoundingClientRect().top < vh - 12) el.classList.add("in");
    });
  }
  function queueSweep() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () { rafId = 0; sweep(); });
  }
  function observeReveal() {
    var els = $$(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -40px 0px", threshold: 0.04 });
    }
    els.forEach(function (el) { io.observe(el); });
    queueSweep();
  }

  /* ------------------------------------------------------------------ categories */
  function renderCategories() {
    var host = $("#catGrid");
    if (!host) return;
    var counts = C.counts();
    host.innerHTML = C.cats().map(function (c) {
      return '' +
        '<button class="cat reveal" type="button" data-cat="' + esc(c.id) + '" aria-pressed="false">' +
          '<span class="glow" style="background:' + esc(c.c2) + '"></span>' +
          '<span class="cico" style="background:linear-gradient(140deg,' + esc(c.c1) + ',' + esc(c.c2) + ')">' + esc(c.icon) + "</span>" +
          "<h3>" + esc(c.name) + "</h3>" +
          "<p>" + esc(c.blurb) + "</p>" +
          '<span class="count">' + (counts[c.id] || 0) + " ebooks in this category</span>" +
        "</button>";
    }).join("");
    host.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) return;
      state.cat = b.dataset.cat;
      state.q = "";
      var q = $("#q"); if (q) q.value = "";
      renderShelf();
      var shelf = $("#shelf");
      if (shelf) shelf.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ------------------------------------------------------------------ filters */
  function renderFilterBar() {
    var host = $("#filterBar");
    if (!host) return;
    var counts = C.counts();
    var all = '<button class="fchip" type="button" data-cat="all" aria-pressed="' + (state.cat === "all") + '">All ebooks <b>' + C.ebooks().length + "</b></button>";
    host.innerHTML = all + C.cats().map(function (c) {
      return '<button class="fchip" type="button" data-cat="' + esc(c.id) + '" aria-pressed="' + (state.cat === c.id) + '">' +
        esc(c.name) + " <b>" + (counts[c.id] || 0) + "</b></button>";
    }).join("");
  }

  /* ------------------------------------------------------------------ shelf */
  function bookCard(b, i) {
    var owned = S.owns(b.id), inCart = S.inCart(b.id);
    var action = owned
      ? '<button class="btn owned" type="button" data-open="' + esc(b.id) + '">✓ In my library</button>'
      : (inCart
        ? '<button class="btn owned" type="button" data-goto-cart="1">Added · view cart</button>'
        : '<button class="btn buy" type="button" data-add="' + esc(b.id) + '" aria-label="Add ' + esc(b.title) + ' to my library">Add to my library</button>');
    return '' +
      '<article class="ebook reveal" data-d="' + (i % 3) + '">' +
        '<div class="cover">' +
          '<img src="assets/img/blog/' + esc(b.img) + '.jpg" width="1200" height="750" loading="lazy" decoding="async" alt="Cover image for ' + esc(b.title) + '">' +
          '<span class="cat-tag">' + esc(b.catName) + "</span>" +
          '<span class="hbadge">✍ Human-written</span>' +
          '<p class="ttl">' + esc(b.title) + "</p>" +
        "</div>" +
        '<div class="body">' +
          "<h3><a href=\"#\" data-open=\"" + esc(b.id) + "\">" + esc(b.title) + "</a></h3>" +
          '<p class="sub">' + esc(b.sub) + "</p>" +
          '<div class="meta">' +
            '<span class="stars" aria-hidden="true">' + "★".repeat(Math.round(Number(b.rating))) + "</span>" +
            "<span>" + esc(String(b.rating)) + " · " + b.readers + " readers</span>" +
            
          "</div>" +
          '<div class="foot">' +
            "" +
            action +
          "</div>" +
        "</div>" +
      "</article>";
  }

  function renderShelf() {
    var host = $("#ebookGrid");
    if (!host) return;
    var list = state.q ? C.search(state.q) : C.ebooks();
    if (state.cat !== "all") list = list.filter(function (b) { return b.cat === state.cat; });
    host.innerHTML = list.map(bookCard).join("");
    var count = $("#shelfCount");
    if (count) {
      count.textContent = list.length
        ? "Showing " + list.length + " of " + C.ebooks().length + " ebooks — every one human-written"
        : "No ebook matched";
    }
    var empty = $("#emptyState");
    if (empty) empty.hidden = list.length > 0;
    $$("#filterBar .fchip").forEach(function (c) {
      var on = c.dataset.cat === state.cat;
      c.classList.toggle("on", on);
      c.setAttribute("aria-pressed", String(on));
    });
    $$("#catGrid .cat").forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.dataset.cat === state.cat));
    });
    observeReveal();
  }

  /* ------------------------------------------------------------------ articles */
  function renderArticles() {
    var host = $("#artGrid");
    if (!host) return;
    host.innerHTML = C.articles().slice(0, 9).map(function (a, i) {
      var c = C.cat(a.cat);
      return '' +
        '<article class="acard reveal" data-d="' + (i % 3) + '">' +
          '<img src="assets/img/blog/' + esc(a.img) + '.jpg" width="1200" height="675" loading="lazy" decoding="async" alt="Illustration for ' + esc(a.title) + '">' +
          '<div class="abody">' +
            "<h3>" + esc(a.title) + "</h3>" +
            "<p>" + esc(a.excerpt) + "</p>" +
            '<div class="ameta"><span>' + esc(c ? c.name : "Journal") + "</span><span>·</span><span>" + a.mins + " min read</span></div>" +
          "</div>" +
        "</article>";
    }).join("");
    observeReveal();
  }

  /* ------------------------------------------------------------------ cart drawer */
  function openDrawer(html, label) {
    var d = $("#drawer"), bg = $("#drawerBg");
    d.setAttribute("aria-label", label || "Panel");
    d.innerHTML = '<button class="x" type="button" aria-label="Close">✕</button>' + html;
    d.hidden = false; bg.hidden = false;
    document.body.style.overflow = "hidden";
    var x = $(".x", d);
    if (x) x.focus();
    function close() { d.hidden = true; bg.hidden = true; document.body.style.overflow = ""; }
    x.addEventListener("click", close);
    bg.addEventListener("click", close);
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
    });
    return close;
  }

  function renderCart() {
    var books = S.cartBooks();
    var rows = books.length ? books.map(function (b) {
      return '' +
        '<div class="cart-row">' +
          '<img src="assets/img/blog/' + esc(b.img) + '.jpg" width="112" height="148" loading="lazy" alt="">' +
          '<div class="grow">' +
            '<span class="t">' + esc(b.title) + "</span>" +
            '<span class="tiny muted">' + esc(b.catName) + "</span>" +
            '<button class="tiny" type="button" data-remove="' + esc(b.id) + '" style="justify-self:start;color:#C01A63;font-weight:700;margin-top:4px">Remove</button>' +
          "</div>" +
        "</div>";
    }).join("") : '<p class="muted" style="padding:26px 0">Your cart is empty. Add the ebooks you need — all written and edited by humans.</p>';

    var html = '' +
      "<h3>My library cart</h3>" +
      '<p class="hint" style="margin-bottom:14px">' + books.length + " ebook" + (books.length === 1 ? "" : "s") + "</p>" +
      rows +
      (books.length ? (
        '<div class="cart-total"><span>Total (' + books.length + " ebook" + (books.length === 1 ? "" : "s") + ")</span></div>" +
        '<button class="btn full lg" type="button" id="checkoutBtn">Checkout — add to my library</button>' +
        '<div class="pay-note"><b>Payment is not live in this build.</b> No card is charged and no card details are collected. ' +
        "Connect a real processor (Stripe, Gumroad or Razorpay) and let the webhook write the entitlement row before you sell anything.</div>" +
        '<button class="btn ghost full" type="button" id="clearCart" style="margin-top:10px">Empty the cart</button>'
      ) : '<a class="btn ghost full" href="#shelf">Browse the shelf</a>');

    var close = openDrawer(html, "My library cart");

    $$("[data-remove]").forEach(function (b) {
      b.addEventListener("click", function () {
        S.removeFromCart(b.dataset.remove);
        close(); renderCart(); renderShelf();
      });
    });
    var clear = $("#clearCart");
    if (clear) clear.addEventListener("click", function () { S.clearCart(); close(); renderCart(); renderShelf(); });
    var co = $("#checkoutBtn");
    if (co) co.addEventListener("click", function () {
      var n = S.grantFromCart();
      App.renderCartBadge();
      renderShelf();
      updateLibraryUI();
      close();
      App.toast("Demo: " + n + " ebook" + (n === 1 ? "" : "s") + " added to your library. No payment was taken.");
      var shelf = $("#shelf");
      if (shelf) shelf.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openBook(id) {
    var b = C.byId(id);
    if (!b) return;
    var owned = S.owns(id);
    var rel = C.ebooks().filter(function (x) { return x.cat === b.cat && x.id !== b.id; }).slice(0, 2);
    var html = '' +
      '<img class="dimg" src="assets/img/blog/' + esc(b.img) + '.jpg" width="1200" height="675" alt="">' +
      '<p class="tiny muted" style="margin-top:12px">' + esc(b.catName) + " · " + b.pages + " pages · " + b.readMins + " min read · " + b.audioMins + " min listen</p>" +
      "<h3 style=\"margin:8px 0 4px\">" + esc(b.title) + "</h3>" +
      '<p class="lead" style="font-size:.98rem">' + esc(b.sub) + "</p>" +
      "<p style=\"margin-top:12px;font-size:.94rem\">" + esc(b.about) + "</p>" +
      '<div class="kv"><span>Format</span><span>Read in the browser or listen — one purchase, yours to keep</span></div>' +
      '<div class="kv"><span>Every title</span><span>Researched, written and edited by a person</span></div>' +
      '<div class="kv"><span>Chapters</span><span>' + b.chapters + "</span></div>" +
      '<div class="kv"><span>You will get</span><span>' + esc((b.outcomes || []).join(" · ")) + "</span></div>" +
      '<div class="pay-note" style="margin-top:16px"><b>Read or listen.</b> Buying once gives you both modes, and your place is kept in sync between them.</div>' +
      (owned
        ? '<button class="btn owned full lg" type="button" disabled style="margin-top:14px">✓ Already in your library</button>'
        : '<button class="btn buy full lg" type="button" data-add="' + esc(b.id) + '" style="margin-top:14px">Add to my library</button>') +
      (rel.length ? "<h4 style=\"margin:18px 0 6px\">More in " + esc(b.catName) + "</h4><div class=\"rel\">" + rel.map(function (r) {
        return '<button class="relitem" type="button" data-open="' + esc(r.id) + '"><img src="assets/img/blog/' + esc(r.img) + '.jpg" width="74" height="46" loading="lazy" alt=""><span><b>' + esc(r.title) + "</b><em class=\"tiny muted\">" + "</em></span></button>";
      }).join("") + "</div>" : "");

    var close = openDrawer(html, "Ebook details");
    $$("[data-open]", $("#drawer")).forEach(function (el) {
      el.addEventListener("click", function () { close(); openBook(el.dataset.open); });
    });
    $$("[data-add]", $("#drawer")).forEach(function (el) {
      el.addEventListener("click", function () {
        S.addToCart(el.dataset.add);
        close(); renderShelf(); App.toast("Added to your cart. Checkout when you are ready.");
      });
    });
  }

  /* ------------------------------------------------------------------ library UI */
  function updateLibraryUI() {
    var n = S.library().length;
    var lc = $("#libCount");
    if (lc) lc.textContent = n + (n === 1 ? " book" : " books");
    var ps = $("#phoneStat");
    if (ps) {
      var done = Math.max(1, Math.round(n * 0.3)), prog = Math.max(1, Math.round(n * 0.35));
      ps.textContent = n
        ? n + " books · " + done + " completed · " + prog + " in progress"
        : "3 books · 1 completed · 1 in progress";
    }
    var badge = $("#cartBadge");
    if (badge) badge.hidden = S.cart().length === 0;
  }

  /* ------------------------------------------------------------------ the Read/Listen sync demo */
  function wireSyncDemo() {
    var fill = $("#syncFill"), pct = $("#syncPct"), note = $("#syncNote");
    var target = { read: 72, listen: 41 };
    var mode = "read";
    function paint() {
      if (!fill) return;
      fill.style.width = target[mode] + "%";
      if (pct) pct.textContent = target[mode] + "%";
      if (note) {
        note.textContent = mode === "read"
          ? "Reading progress and listening progress stay in step."
          : "Switched to audio — continuing from the same place, not the start.";
      }
    }
    $$(".mode-toggle button").forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.dataset.mode;
        $$(".mode-toggle button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        if (mode === "listen") target.listen = target.read;
        paint();
      });
    });
    paint();
  }

  /* ------------------------------------------------------------------ forms */
  function wireGuideForm() {
    var f = $("#guideForm");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = ($("#guideEmail").value || "").trim();
      var consent = $("#guideConsent").checked;
      var msg = $("#guideMsg");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msg.className = "err"; msg.textContent = "Please enter a valid email address."; return;
      }
      if (!consent) {
        msg.className = "err"; msg.textContent = "Please tick the box so we know you asked for the guide."; return;
      }
      var total = S.addSubscriber(email, consent);
      msg.className = "hint";
      msg.textContent = "Thank you — the guide is on its way to " + email + ". Unsubscribe any time. (Demo form: " + total + " stored locally, nothing sent.)";
      f.reset();
    });
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    if (!window.Brio || !window.Brio.Catalog.cats().length) {
      App.toast("The catalog could not be loaded.");
      return;
    }
    renderCategories();
    renderFilterBar();
    renderShelf();
    renderArticles();
    updateLibraryUI();
    wireSyncDemo();
    wireGuideForm();
    App.renderCartBadge();

    /* marquee needs two identical halves for a seamless loop */
    var track = $("#mqTrack");
    if (track && !track.querySelector(".mq-half + .mq-half")) {
      track.appendChild(track.querySelector(".mq-half").cloneNode(true));
    }

    /* delegated clicks */
    document.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (add) {
        e.preventDefault();
        S.addToCart(add.dataset.add);
        renderShelf();
        App.toast("Added to your cart. Open the cart when you are ready.");
        return;
      }
      if (e.target.closest("[data-goto-cart]")) { e.preventDefault(); renderCart(); return; }
      var open = e.target.closest("[data-open]");
      if (open) { e.preventDefault(); openBook(open.dataset.open); return; }
      var chip = e.target.closest("#filterBar .fchip");
      if (chip) {
        state.cat = chip.dataset.cat;
        state.q = "";
        var q = $("#q"); if (q) q.value = "";
        renderShelf();
        return;
      }
      if (e.target.closest("#cartBtn")) { e.preventDefault(); renderCart(); return; }
    });

    /* search */
    var form = $("#searchForm"), input = $("#q");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        state.q = (input.value || "").trim().toLowerCase();
        state.cat = "all";
        renderShelf();
      });
      input.addEventListener("input", function (e) {
        state.q = e.target.value.trim().toLowerCase();
        state.cat = "all";
        renderShelf();
      });
    }
    var clearAll = $("#clearAll");
    if (clearAll) clearAll.addEventListener("click", function () {
      state.q = ""; state.cat = "all";
      if (input) input.value = "";
      renderShelf();
    });

    /* scroll / resize */
    var hdr = $("#siteHeader");
    function onScroll() {
      hdr.classList.toggle("stuck", window.scrollY > 8);
      var de = document.documentElement;
      var max = de.scrollHeight - window.innerHeight;
      var bar = $(".progress i");
      if (bar) bar.style.width = (max > 10 ? (window.scrollY / max) * 100 : 0) + "%";
      queueSweep();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", queueSweep, { passive: true });
    window.addEventListener("orientationchange", queueSweep, { passive: true });
    onScroll();

    /* mobile menu */
    var burger = $("#burger"), mobile = $("#mobileNav");
    if (burger && mobile) {
      burger.addEventListener("click", function () {
        var open = mobile.hidden;
        mobile.hidden = !open;
        burger.setAttribute("aria-expanded", String(open));
      });
      $$("a", mobile).forEach(function (a) {
        a.addEventListener("click", function () {
          mobile.hidden = true;
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }

    var yr = $("#yr");
    if (yr) yr.textContent = String(new Date().getFullYear());

    if (window.BrioTrail) window.BrioTrail.reset();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
