/* Sign-in page helper: one click fills the seeded test account.
   External file, so the page needs no inline script and no CSP exception. */
(function () {
  'use strict';
  var btn = document.getElementById('fillDemo');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    if (email) email.value = btn.getAttribute('data-email') || '';
    if (password) password.value = btn.getAttribute('data-password') || '';
    if (password) password.focus();
  });
})();
