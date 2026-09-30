/* =========================================================================
   Brio — small page behaviours
   Year stamp, smooth in-page anchors that respect the sticky header, a print
   shortcut and the marquee safety-net (the band keeps running even if the
   duplicate half was not generated).
   ========================================================================= */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var yr = document.getElementById("yr");
    if (yr) yr.textContent = String(new Date().getFullYear());

    /* the marquee loops by translating -50%, which needs two identical halves */
    var track = document.getElementById("mqTrack");
    if (track) {
      var half = track.querySelector(".mq-half");
      if (half && track.children.length < 2) track.appendChild(half.cloneNode(true));
    }

    /* in-page anchors, offset for the sticky header */
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]:not([data-post])');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
      if (history.replaceState) history.replaceState(null, "", "#" + id);
    });
  });
})();
