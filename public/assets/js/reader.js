/* Reading page: live session timer + progress reporting.
   Loaded only by /read/:id (a server-rendered page). No inline script. */
(function () {
  'use strict';

  var root = document.getElementById('reader');
  if (!root) return;

  var bookId = root.getAttribute('data-book-id') || '';
  var bar = document.getElementById('rdBar');
  var minsEl = document.getElementById('rdMins');
  var pctEl = document.getElementById('rdPct');
  var statusEl = document.getElementById('rdStatus');
  var doneBtn = document.getElementById('rdDone');

  var csrf = (document.cookie.match(/(?:^|;\s*)brio_csrf=([^;]+)/) || [])[1] || '';
  var startPercent = Number(root.getAttribute('data-percent') || 0);
  var seconds = 0;
  var finished = root.getAttribute('data-finished') === 'true';

  function paint() {
    var minutes = Math.max(0, Math.round(seconds / 60));
    var projected = finished ? 100 : Math.min(99, Math.round(startPercent + (seconds / 60) * 4));
    if (minsEl) minsEl.textContent = minutes + (minutes === 1 ? ' min' : ' min');
    if (pctEl) pctEl.textContent = projected + '%';
    if (bar) bar.style.setProperty('--p', (finished ? 100 : projected) + '%');
    if (doneBtn && finished) doneBtn.disabled = true;
  }

  function report() {
    if (!bookId || seconds < 20) return Promise.resolve(null);
    var body = {
      bookId: bookId,
      minutes: Math.max(1, Math.round(seconds / 60)),
      percent: finished ? 100 : Math.min(99, Math.round(startPercent + (seconds / 60) * 4)),
      finished: finished
    };
    seconds = 0;
    return fetch('/api/progress', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (statusEl && r.ok) statusEl.textContent = 'Progress saved ' + new Date().toLocaleTimeString();
      return r.ok;
    }).catch(function () {
      if (statusEl) statusEl.textContent = 'Offline — progress will save when you are back.';
      return false;
    });
  }

  setInterval(function () { seconds += 1; paint(); }, 1000);
  setInterval(report, 30000);

  window.addEventListener('pagehide', function () {
    if (seconds < 20 || !bookId) return;
    try {
      var payload = JSON.stringify({
        bookId: bookId,
        minutes: Math.max(1, Math.round(seconds / 60)),
        percent: finished ? 100 : Math.min(99, Math.round(startPercent + seconds / 60 * 4)),
        finished: finished
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/progress?csrf=' + encodeURIComponent(csrf), new Blob([payload], { type: 'application/json' }));
      }
    } catch (e) { /* best effort */ }
  });

  if (doneBtn) {
    doneBtn.addEventListener('click', function () {
      finished = true;
      doneBtn.disabled = true;
      report().then(function () {
        if (statusEl) statusEl.textContent = 'Marked as finished.';
        paint();
      });
    });
  }

  paint();
})();
