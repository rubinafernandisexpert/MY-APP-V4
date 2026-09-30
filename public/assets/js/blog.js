/* =========================================================================
   Brio — The Journal (archive index)
   Card grid: featured image, title, publish date + time, meta description.
   Newest first, infinite scroll as you keep scrolling, plus a search box that
   filters the archive in place. No topic filters, no sort control, no stat
   strip — the archive itself is the interface.

   Safety rules kept from the previous revision:
     - a card is revealed whenever it is at or above the fold, so a card can
       never be left invisible waiting for an observer that never fires
     - no eval / new Function, all data goes through esc()
   ========================================================================= */
(function () {
  "use strict";

  var POSTS = (window.BRIO_POSTS || []).slice();
  var CATS = window.BRIO_CATEGORIES || [];
  var BATCH_FIRST = 9;   /* 3 x 3 on the first screen */
  var BATCH_MORE = 6;    /* each scroll step */
  var MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  /* formatted from the UTC values so the printed time never drifts by timezone */
  function fmtDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
  }
  function fmtTime(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
  }
  function relative(iso) {
    var days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return days + " days ago";
    if (days < 60) return "last month";
    return Math.floor(days / 30) + " months ago";
  }
  function catLabel(id) {
    var c = CATS.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : "Journal";
  }

  var state = { q: "", shown: 0, list: [] };

  function sorted() {
    return POSTS.slice().sort(function (a, b) { return b.iso.localeCompare(a.iso); });
  }
  function matches(p) {
    if (!state.q) return true;
    var hay = [p.title, p.excerpt, (p.tags || []).join(" "), catLabel(p.cat), p.author].join(" ").toLowerCase();
    return state.q.split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) > -1; });
  }
  function recompute() {
    state.list = sorted().filter(matches);
  }

  /* ------------------------------------------------------------------ markup */
  function cardHTML(p, i) {
    var fresh = (Date.now() - new Date(p.iso).getTime()) / 86400000 < 10;
    return '' +
      '<article class="pcard card lift" data-reveal data-delay="' + (i % 3) + '">' +
        '<a class="thumb" href="#" data-post="' + esc(p.slug) + '" tabindex="-1" aria-hidden="true">' +
          '<img src="assets/img/blog/' + esc(p.img) + '.jpg" width="1200" height="675" loading="lazy" decoding="async" alt="' + esc(p.imgAlt) + '">' +
        '</a>' +
        '<div class="pbody">' +
          '<div class="pmeta">' +
            '<span class="tag">' + esc(catLabel(p.cat)) + '</span>' +
            (fresh ? '<span class="tag b">New</span>' : '') +
            '<time class="when" datetime="' + esc(p.iso) + '" title="' + esc(relative(p.iso)) + '">' +
              esc(fmtDate(p.iso)) + ' · ' + esc(fmtTime(p.iso)) +
            '</time>' +
          '</div>' +
          '<h3><a href="#" data-post="' + esc(p.slug) + '">' + esc(p.title) + '</a></h3>' +
          '<p class="ex">' + esc(p.excerpt) + '</p>' +
          '<div class="pfoot">' +
            '<span class="who">' + esc(p.author) + '</span>' +
            '<span class="dotsep">•</span>' +
            '<span>' + p.minutes + ' min read</span>' +
            '<button class="read" type="button" data-post="' + esc(p.slug) + '">Read note<span class="arw">→</span></button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function featuredHTML(p) {
    return '' +
      '<article class="feat card shimmer" id="featured">' +
        '<a class="fthumb" href="#" data-post="' + esc(p.slug) + '" aria-label="' + esc(p.title) + '">' +
          '<img src="assets/img/blog/' + esc(p.img) + '.jpg" width="1200" height="675" loading="eager" decoding="async" alt="' + esc(p.imgAlt) + '">' +
        '</a>' +
        '<div class="fbody">' +
          '<div class="pmeta"><span class="tag k">Just published</span><span class="tag">' + esc(catLabel(p.cat)) + '</span></div>' +
          '<h2><a href="#" data-post="' + esc(p.slug) + '">' + esc(p.title) + '</a></h2>' +
          '<p class="lead">' + esc(p.excerpt) + '</p>' +
          '<div class="pfoot">' +
            '<span class="who">' + esc(p.author) + '</span><span class="dotsep">•</span>' +
            '<time datetime="' + esc(p.iso) + '">' + esc(fmtDate(p.iso)) + ' · ' + esc(fmtTime(p.iso)) + '</time>' +
            '<span class="dotsep">•</span><span>' + p.minutes + ' min read</span>' +
          '</div>' +
          '<div class="pfoot" style="gap:14px">' +
            '<a class="btn" href="#" data-post="' + esc(p.slug) + '">Read the article</a>' +
            '<a class="btn ghost" href="#journal">See the full archive</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* ------------------------------------------------------------------ render */
  var grid, sentinel, moreBtn, countEl, emptyEl;

  function renderGrid() {
    var slice = state.list.slice(0, state.shown);
    grid.innerHTML = slice.map(cardHTML).join("");
    grid.setAttribute("aria-busy", "false");
    var total = state.list.length;
    countEl.textContent = total
      ? (state.q
          ? "Found " + total + " article" + (total === 1 ? "" : "s") + " · showing " + slice.length
          : "Showing " + slice.length + " of " + total + " articles")
      : "No article matched";
    emptyEl.hidden = total > 0;
    var more = slice.length < total;
    moreBtn.hidden = !more;
    sentinel.hidden = !more;
    observeReveal();
  }

  function loadMore(n) {
    var total = state.list.length;
    if (state.shown >= total) return false;
    state.shown = Math.min(state.shown + (n || BATCH_MORE), total);
    renderGrid();
    return state.shown < total;
  }

  /* ------------------------------------------------------------------ safe reveal */
  var io = null, rafId = 0;
  function revealAll() { $$("[data-reveal]", grid).forEach(function (el) { el.classList.add("in"); }); }
  function sweep() {
    var vh = window.innerHeight;
    $$("[data-reveal]", grid).forEach(function (el) {
      if (el.classList.contains("in")) return;
      if (el.getBoundingClientRect().top < vh - 12) el.classList.add("in");
    });
  }
  function queueSweep() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () { rafId = 0; sweep(); });
  }
  function observeReveal() {
    var els = $$("[data-reveal]", grid);
    if (!("IntersectionObserver" in window)) { revealAll(); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
    }
    els.forEach(function (el) { if (!el.classList.contains("in")) io.observe(el); });
    queueSweep();
  }

  /* ------------------------------------------------------------------ infinite scroll
     Two independent triggers, because older blogs must always keep loading:
       a) the sentinel observer (fires as it comes into view)
       b) a scroll test that loads whenever the reader is near the end of the
          page — this one cannot be missed by a browser or by fast wheel jumps  */
  var busy = false, lastAuto = 0;

  function nearEnd() {
    var de = document.documentElement;
    return (window.innerHeight + window.scrollY) > (de.scrollHeight - 1500);
  }
  function autoLoad() {
    if (busy) return;
    if (state.shown >= state.list.length) return;
    busy = true;
    lastAuto = Date.now();
    loadMore(BATCH_MORE);
    setTimeout(function () { busy = false; }, 300);
  }
  function maybeAutoLoad() {
    if (nearEnd()) autoLoad();
  }
  function watchSentinel() {
    if (!("IntersectionObserver" in window)) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) autoLoad(); });
    }, { rootMargin: "700px 0px" });
    obs.observe(sentinel);
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    grid = $("#postsGrid");
    sentinel = $("#scrollSentinel");
    moreBtn = $("#loadMore");
    countEl = $("#postCount");
    emptyEl = $("#emptyState");
    if (!grid) return;

    var newest = sorted()[0];
    if (newest) $("#featuredSlot").innerHTML = featuredHTML(newest);

    /* the marquee needs two identical halves so the loop is seamless */
    var track = $("#mqTrack");
    if (track && !track.querySelector(".mq-half + .mq-half")) {
      track.appendChild(track.querySelector(".mq-half").cloneNode(true));
    }

    recompute();
    state.shown = Math.min(BATCH_FIRST, state.list.length);
    renderGrid();
    watchSentinel();

    moreBtn.addEventListener("click", function () { loadMore(BATCH_MORE); });

    document.addEventListener("click", function (e) {
      var post = e.target.closest("[data-post]");
      if (post) { e.preventDefault(); openPost(post.dataset.post); }
    });

    var form = $("#searchForm"), input = $("#q");
    if (form && input) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        state.q = (input.value || "").trim().toLowerCase();
        state.shown = BATCH_FIRST;
        recompute();
        renderGrid();
      });
      input.addEventListener("input", function (e) {
        state.q = e.target.value.trim().toLowerCase();
        state.shown = BATCH_FIRST;
        recompute();
        renderGrid();
      });
    }
    var clear = $("#clearSearch");
    if (clear) clear.addEventListener("click", function () {
      if (input) input.value = "";
      state.q = "";
      state.shown = BATCH_FIRST;
      recompute();
      renderGrid();
    });

    var news = $("#subscribeForm");
    if (news) {
      news.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = ($("#subEmail").value || "").trim();
        var consent = $("#subConsent").checked;
        var box = $("#subMsg");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          box.className = "err"; box.textContent = "Please enter a valid email address."; return;
        }
        if (!consent) {
          box.className = "err"; box.textContent = "Please tick the consent box so we know you asked for the emails."; return;
        }
        box.className = "hint";
        box.textContent = "Thank you — we have sent a confirmation to " + email + " with an unsubscribe link. (Demo form: nothing leaves this page.)";
        news.reset();
      });
    }

    var hdr = $("#siteHeader");
    var onScroll = function () { hdr.classList.toggle("stuck", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", function () { queueSweep(); maybeAutoLoad(); }, { passive: true });
    window.addEventListener("load", maybeAutoLoad);
    window.addEventListener("resize", queueSweep, { passive: true });
    window.addEventListener("orientationchange", queueSweep, { passive: true });
    window.addEventListener("beforeprint", revealAll);
    onScroll();

    var burger = $("#burger"), mobile = $("#mobileNav");
    if (burger && mobile) {
      burger.addEventListener("click", function () {
        var open = mobile.classList.toggle("open");
        burger.setAttribute("aria-expanded", String(open));
        mobile.hidden = !open;
      });
      $$("a", mobile).forEach(function (a) {
        a.addEventListener("click", function () {
          mobile.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); mobile.hidden = true;
        });
      });
    }

    maybeAutoLoad();
    if (window.BrioTrail) window.BrioTrail.reset();
  }

  /* ------------------------------------------------------------------ article panel
     In production each slug gets a real article page with an H1, H2s, canonical
     URL, Open Graph tags and internal links. Here the card opens an accessible
     summary panel so no card leads to a missing page.                          */
  function openPost(slug) {
    var p = POSTS.filter(function (x) { return x.slug === slug; })[0];
    if (!p) return;
    var bg = $("#postDrawerBg"), d = $("#postDrawer");
    var related = POSTS.filter(function (x) { return x.cat === p.cat && x.slug !== p.slug; }).slice(0, 2);
    d.innerHTML = '' +
      '<button class="x" type="button" aria-label="Close" id="postClose">✕</button>' +
      '<img class="dimg" src="assets/img/blog/' + esc(p.img) + '.jpg" width="1200" height="675" alt="' + esc(p.imgAlt) + '">' +
      '<div class="pmeta" style="margin-top:16px"><span class="tag">' + esc(catLabel(p.cat)) + '</span>' +
        '<time datetime="' + esc(p.iso) + '">' + esc(fmtDate(p.iso)) + ' · ' + esc(fmtTime(p.iso)) + '</time></div>' +
      '<h2 style="margin:12px 0 10px">' + esc(p.title) + '</h2>' +
      '<p class="lead">' + esc(p.excerpt) + '</p>' +
      '<hr class="hr">' +
      '<div class="kv"><span>Written by</span><span>' + esc(p.author) + '</span></div>' +
      '<div class="kv"><span>Published</span><span>' + esc(fmtDate(p.iso)) + ' at ' + esc(fmtTime(p.iso)) + '</span></div>' +
      '<div class="kv"><span>Reading time</span><span>' + p.minutes + ' minutes</span></div>' +
      '<div class="kv"><span>Topics</span><span>' + esc((p.tags || []).join(", ")) + '</span></div>' +
      '<div class="kv"><span>Meta description</span><span>' + esc(p.excerpt) + '</span></div>' +
      '<hr class="hr">' +
      '<p class="hint">The full article body is authored per slug on publication. This build ships the journal index, the card grid, ordering, search and pagination.</p>' +
      (related.length ? '<h4 style="margin:18px 0 10px">More in ' + esc(catLabel(p.cat)) + '</h4>' +
        '<div class="rel">' + related.map(function (r) {
          return '<a class="relitem" href="#" data-post="' + esc(r.slug) + '"><img src="assets/img/blog/' + esc(r.img) + '.jpg" width="104" height="59" loading="lazy" alt=""><span><b>' + esc(r.title) + '</b><em>' + esc(fmtDate(r.iso)) + '</em></span></a>';
        }).join("") + "</div>" : "") +
      '<button class="btn full" type="button" id="postClose2" style="margin-top:22px">Back to the archive</button>';
    bg.hidden = false; d.hidden = false;
    document.body.style.overflow = "hidden";
    $("#postClose").focus();
    function close() { bg.hidden = true; d.hidden = true; document.body.style.overflow = ""; }
    $("#postClose").addEventListener("click", close);
    $("#postClose2").addEventListener("click", close);
    bg.addEventListener("click", close);
    document.addEventListener("keydown", function onKey(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
