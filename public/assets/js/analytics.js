(function () {
  "use strict";
  /* Brio - hero reading-analytics panel.
     Illustrative sample data: the numbers drift up and down so the panel is
     visibly alive. In production these come from real read and listen events.
     No timer runs when the visitor prefers reduced motion. */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.getElementById("analytics");
  if (!root) return;

  var el = {
    num: document.getElementById("anNum"), trend: document.getElementById("anTrend"),
    bars: document.getElementById("anBars"),
    read: document.getElementById("anRead"), readD: document.getElementById("anReadD"),
    listen: document.getElementById("anListen"), listenD: document.getElementById("anListenD"),
    pages: document.getElementById("anPages"), pagesD: document.getElementById("anPagesD"),
    sess: document.getElementById("anSess"), sessD: document.getElementById("anSessD")
  };
  var bars = el.bars ? Array.prototype.slice.call(el.bars.children) : [];
  var s = { min: 38, read: 38, listen: 14, pages: 22, sess: 3 };
  var UP = "\u25B2 ", DOWN = "\u25BC ";

  function chip(node, up, text) {
    if (!node) return;
    node.className = "d " + (up ? "up" : "down");
    node.textContent = (up ? UP : DOWN) + text;
  }
  function step(v, hi, lo, swing) {
    var next = Math.round(v + (Math.random() * 2 - 1) * swing);
    if (next > hi) next = hi;
    if (next < lo) next = lo;
    return next;
  }
  function paint(first) {
    if (el.num) el.num.textContent = String(s.min);
    if (el.read) el.read.textContent = s.read + " min";
    if (el.listen) el.listen.textContent = s.listen + " min";
    if (el.pages) el.pages.textContent = String(s.pages);
    if (el.sess) el.sess.textContent = String(s.sess);
    if (el.trend) {
      var dp = s.min - 34;
      el.trend.className = "an-trend " + (dp >= 0 ? "up" : "down");
      el.trend.textContent = (dp >= 0 ? UP : DOWN) + Math.abs(dp) + "% vs last week";
    }
    chip(el.readD, s.read >= 34, Math.abs(s.read - 34) + "%");
    chip(el.listenD, s.listen >= 15, Math.abs(15 - s.listen) + "%");
    chip(el.pagesD, s.pages >= 20, Math.abs(s.pages - 20) + "%");
    chip(el.sessD, s.sess >= 3, String(Math.abs(s.sess - 3) || 1));
    if (bars.length) {
      bars.forEach(function (b) { b.style.height = (20 + Math.round(Math.random() * 72)) + "%"; });
    }
    if (first) root.className = root.className + " is-ready";
  }
  paint(true);
  if (reduce) return;
  setInterval(function () {
    if (document.hidden) return;
    s.min = step(s.min, 64, 18, 5);
    s.read = step(s.read, 70, 16, 4);
    s.listen = step(s.listen, 30, 5, 3);
    s.pages = step(s.pages, 40, 8, 4);
    s.sess = step(s.sess, 6, 1, 1);
    paint(false);
  }, 2400);
}());
