/* =========================================================================
   Brio — running trail lines (light edition)
   Continuous motion on one canvas: a neon ribbon behind the pointer and a
   dashed neon line that runs along the bottom of the window with a comet
   showing scroll position. Transform/opacity-free by nature (it is canvas),
   paused when the tab hides, hidden for reduced-motion users.
   ========================================================================= */
(function () {
  "use strict";

  var canvas = document.getElementById("trail");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, pts = [], MAX = 26;
  var mouse = { x: -999, y: -999 };
  var scrollT = 0.5, scrollTarget = 0.5;
  var t0 = performance.now(), running = true;

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function palette() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, f) { var x = (cs.getPropertyValue(n) || "").trim(); return x || f; }
    return { pink: v("--n-pink", "#FF2D9B"), green: v("--n-green", "#00D67F"),
             yellow: v("--n-yellow", "#FFC400"), blue: v("--n-blue", "#1FA2FF"),
             purple: v("--n-purple", "#8B5CF6"), ink: v("--ink", "#191033") };
  }

  function ribbon(p, t) {
    if (pts.length < 3) return;
    var cols = [p.purple, p.pink, p.blue, p.green], wid = [12, 7, 3.4, 1.6], al = [0.16, 0.24, 0.44, 0.9];
    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    for (var layer = 0; layer < 4; layer++) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.strokeStyle = cols[(layer + Math.floor(t / 900)) % cols.length];
      ctx.globalAlpha = al[layer];
      ctx.lineWidth = wid[layer];
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function trailY(x, t) { return H - 54 + Math.sin(x / 250 + t / 4300) * 7 + Math.sin(x / 95 + t / 2600) * 3; }

  function trail(p, t) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, trailY(0, t));
    for (var x = 0; x <= W; x += 8) ctx.lineTo(x, trailY(x, t));
    ctx.setLineDash([24, 20]);
    ctx.lineDashOffset = -((t * 0.06) % 44);
    ctx.strokeStyle = p.blue; ctx.globalAlpha = 0.42; ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([]);

    var cx = scrollT * W, cy = trailY(cx, t);
    var grad = ctx.createLinearGradient(cx - 260, 0, cx, 0);
    grad.addColorStop(0, "rgba(139,92,246,0)");
    grad.addColorStop(1, p.pink);
    ctx.beginPath();
    ctx.moveTo(cx - 260, trailY(cx - 260, t));
    for (var xx = cx - 260; xx <= cx; xx += 6) ctx.lineTo(xx, trailY(xx, t));
    ctx.strokeStyle = grad; ctx.globalAlpha = 0.85; ctx.lineWidth = 3; ctx.stroke();

    var pulse = 1 + Math.sin(t / 430) * 0.2;
    ctx.beginPath(); ctx.arc(cx, cy, 4.2 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = p.yellow; ctx.globalAlpha = 0.95; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 12 * pulse, 0, Math.PI * 2);
    ctx.globalAlpha = 0.2; ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!running) return;
    var t = (now || performance.now()) - t0 + 1;
    ctx.clearRect(0, 0, W, H);
    var p = palette();
    scrollT += (scrollTarget - scrollT) * 0.09;
    trail(p, t);
    if (fine.matches) {
      if (pts.length) {
        var last = pts[pts.length - 1];
        last.x += (mouse.x - last.x) * 0.32;
        last.y += (mouse.y - last.y) * 0.32;
      }
      ribbon(p, t);
    }
    requestAnimationFrame(frame);
  }

  function onMove(e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    var last = pts[pts.length - 1];
    if (!last || Math.hypot(last.x - mouse.x, last.y - mouse.y) > 7) {
      pts.push({ x: mouse.x, y: mouse.y });
      if (pts.length > MAX) pts.shift();
    }
  }
  function onLeave() {
    pts.push({ x: -999, y: -999 });
    if (pts.length > MAX) pts.shift();
    mouse.x = -999; mouse.y = -999;
  }
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollTarget = max > 40 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0.5;
  }
  function sync() {
    canvas.style.display = reduce.matches ? "none" : "";
    if (reduce.matches) running = false;
    else if (!running) { running = true; requestAnimationFrame(frame); }
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("mousemove", onMove, { passive: true });
  document.addEventListener("mouseleave", onLeave, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else if (!reduce.matches) { running = true; requestAnimationFrame(frame); }
  });
  if (reduce.addEventListener) reduce.addEventListener("change", sync);

  window.BrioTrail = { reset: function () { t0 = performance.now(); onScroll(); } };

  resize(); sync(); onScroll();
  if (!reduce.matches) requestAnimationFrame(frame);
})();
