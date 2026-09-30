'use strict';
/* ---------------------------------------------------------------------------
   Brio — application server.

     npm start        → http://localhost:3000
     GET  /            storefront (static, from public/)
     GET  /login       sign in
     GET  /library     personal library dashboard   (auth)
     GET  /read/:id    reader page                  (auth + entitlement)
     /api/*            JSON API
   --------------------------------------------------------------------------- */
const path = require('path');
const express = require('express');

const db = require('./db');
const auth = require('./auth');
const stats = require('./stats');
const catalog = require('./catalog');
const pages = require('./pages');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, '..', 'public');
const IS_PROD = process.env.NODE_ENV === 'production';

if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ---- security headers -------------------------------------------------- */
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ') + (IS_PROD ? '; upgrade-insecure-requests' : ''));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));
app.use(auth.ensureCsrf);
app.use(auth.optionalAuth);

/* ---- static storefront ------------------------------------------------- */
app.use(express.static(PUBLIC, {
  dotfiles: 'ignore',
  index: 'index.html',
  extensions: false,
  maxAge: IS_PROD ? '1h' : 0
}));

/* ---- helpers ----------------------------------------------------------- */
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
const clean = (s, max) => String(s == null ? '' : s).trim().slice(0, max || 200);
const originOf = (req) => {
  const host = req.get('host');
  const proto = req.protocol || 'http';
  return proto + '://' + host;
};
const safeNext = (n) => (/^\/[a-zA-Z0-9\-._~!$&'()*+,;=:@%/?#\[\]]*$/.test(String(n || '')) ? String(n) : '/library');

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

/* ========================================================================
   Health
   ===================================================================== */
app.get('/healthz', (req, res) => {
  let catalogOk = true;
  try { catalog.books(); } catch (e) { catalogOk = false; }
  const ok = catalogOk;
  res.status(ok ? 200 : 503).json({
    ok,
    service: 'brio',
    version: require('../package.json').version,
    env: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.round(process.uptime()),
    catalog: { categories: ok ? catalog.cats().length : 0, ebooks: ok ? catalog.books().length : 0 },
    users: db.userCount(),
    dbFile: db.FILE,
    time: new Date().toISOString()
  });
});

/* ========================================================================
   Auth — HTML
   ===================================================================== */
app.get('/login', (req, res) => {
  if (req.user) return res.redirect(302, safeNext(req.query.next || '/library'));
  res.send(pages.loginPage({
    user: null,
    csrf: res.locals.csrf,
    error: req.query.error ? String(req.query.error).slice(0, 200) : '',
    notice: req.query.notice ? String(req.query.notice).slice(0, 200) : '',
    next: safeNext(req.query.next)
  }));
});

app.post('/login', auth.checkCsrf, (req, res) => {
  const email = clean(req.body.email, 200).toLowerCase();
  const password = String(req.body.password || '');
  const next = safeNext(req.body.next);
  const fail = (msg) => res.status(401).send(pages.loginPage({
    user: null, csrf: res.locals.csrf, error: msg, next
  }));

  if (auth.loginBlocked(req, email)) {
    return res.status(429).send(pages.loginPage({
      user: null, csrf: res.locals.csrf,
      error: 'Too many attempts. Wait ten minutes and try again.', next
    }));
  }
  const user = db.findUserByEmail(email);
  if (!user || !auth.verifyPassword(password, user.passwordHash)) {
    auth.noteFailure(req, email);
    return fail('Email or password is incorrect.');
  }
  auth.clearFailures(req, email);
  db.touchLogin(user.id);
  auth.setSession(res, user.id, req);
  res.redirect(303, next);
});

app.get('/register', (req, res) => {
  if (req.user) return res.redirect(302, '/library');
  res.send(pages.registerPage({ user: null, csrf: res.locals.csrf, error: '' }));
});

app.post('/register', auth.checkCsrf, (req, res) => {
  const email = clean(req.body.email, 200).toLowerCase();
  const name = clean(req.body.name, 80) || email.split('@')[0];
  const password = String(req.body.password || '');
  const fail = (msg) => res.status(400).send(pages.registerPage({ user: null, csrf: res.locals.csrf, error: msg }));

  if (!isEmail(email)) return fail('That email address does not look right.');
  if (password.length < 8) return fail('Use at least 8 characters for the password.');
  if (db.findUserByEmail(email)) return fail('An account with that email already exists — sign in instead.');

  const user = db.createUser({ email, name, passwordHash: auth.hashPassword(password) });
  db.touchLogin(user.id);
  auth.setSession(res, user.id, req);
  res.redirect(303, '/library');
});

app.post('/logout', auth.checkCsrf, (req, res) => {
  auth.clearSession(res, req);
  res.redirect(303, '/login?notice=' + encodeURIComponent('You are signed out.'));
});

/* ========================================================================
   Auth — API
   ===================================================================== */
app.post('/api/auth/register', auth.checkCsrf, (req, res) => {
  const email = clean(req.body.email, 200).toLowerCase();
  const name = clean(req.body.name, 80) || email.split('@')[0];
  const password = String(req.body.password || '');
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });
  if (password.length < 8) return res.status(400).json({ ok: false, error: 'weak_password' });
  if (db.findUserByEmail(email)) return res.status(409).json({ ok: false, error: 'email_taken' });
  const user = db.createUser({ email, name, passwordHash: auth.hashPassword(password) });
  auth.setSession(res, user.id, req);
  res.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/login', auth.checkCsrf, (req, res) => {
  const email = clean(req.body.email, 200).toLowerCase();
  const password = String(req.body.password || '');
  if (auth.loginBlocked(req, email)) return res.status(429).json({ ok: false, error: 'too_many_attempts' });
  const user = db.findUserByEmail(email);
  if (!user || !auth.verifyPassword(password, user.passwordHash)) {
    const left = auth.noteFailure(req, email);
    return res.status(401).json({ ok: false, error: 'invalid_credentials', attemptsLeft: left });
  }
  auth.clearFailures(req, email);
  db.touchLogin(user.id);
  auth.setSession(res, user.id, req);
  res.json({ ok: true, user: publicUser(user) });
});

app.post('/api/auth/logout', auth.checkCsrf, (req, res) => {
  auth.clearSession(res, req);
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.user) return res.json({ ok: true, user: null });
  res.json({ ok: true, user: publicUser(req.user), csrf: res.locals.csrf });
});

/* ========================================================================
   Catalog + library API
   ===================================================================== */
app.get('/api/catalog', (req, res) => {
  res.json({
    ok: true,
    categories: catalog.cats(),
    countByCategory: catalog.catCounts(),
    ebooks: catalog.books(),
    pricing: { configured: true }   // amounts live in server config, not in the storefront
  });
});

app.get('/api/library', auth.requireAuth, (req, res) => {
  const progress = db.progressFor(req.user.id);
  const owned = db.entitlements(req.user.id).map((e) => {
    const book = catalog.byId(e.bookId);
    const p = progress.find((x) => x.bookId === e.bookId) || { percent: 0, minutes: 0, finished: false };
    return {
      bookId: e.bookId,
      ownedSince: e.createdAt,
      source: e.source,
      percent: p.percent || 0,
      minutes: p.minutes || 0,
      finished: !!p.finished,
      book: book || { id: e.bookId, title: e.bookId, catName: 'Unknown', subtitle: '', img: 'b01' }
    };
  });
  res.json({
    ok: true,
    books: owned.map((o) => ({
      id: o.bookId, title: o.book.title, catName: o.book.catName, subtitle: o.book.subtitle,
      img: o.book.img, percent: o.percent, minutes: o.minutes, finished: o.finished
    })),
    totals: stats.totals(req.user.id),
    catalog: catalog.books().map((b) => ({ id: b.id, title: b.title }))
  });
});

/* Grant entitlements for the cart. Titles are matched against the catalog so
   the client never has to know our internal ids. */
app.post('/api/library/claim', auth.requireAuth, auth.checkCsrf, (req, res) => {
  const titles = Array.isArray(req.body.titles) ? req.body.titles.slice(0, 50) : [];
  const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(0, 50) : [];
  const resolved = [];
  const unresolved = [];

  titles.forEach((t) => {
    const b = catalog.byTitle(clean(t, 200));
    if (b) resolved.push(b); else unresolved.push(clean(t, 120));
  });
  ids.forEach((i) => {
    const b = catalog.byId(clean(i, 60));
    if (b && !resolved.some((r) => r.id === b.id)) resolved.push(b);
  });

  if (!resolved.length) {
    return res.status(400).json({ ok: false, error: 'nothing_resolved', unresolved });
  }

  const added = [];
  const alreadyOwned = [];
  resolved.forEach((b) => {
    const r = db.addEntitlement(req.user.id, b.id, 'checkout');
    if (r.created) added.push({ id: b.id, title: b.title }); else alreadyOwned.push({ id: b.id, title: b.title });
  });

  if (added.length) {
    db.addPurchase(req.user.id, {
      provider: process.env.PAYMENT_PROVIDER || 'none',
      amountCents: added.length * Number(process.env.EBOOK_PRICE_CENTS || 200),
      currency: process.env.CURRENCY || 'USD',
      status: 'placeholder'
    });
    added.forEach((b) => db.addEvent(req.user.id, { type: 'read', bookId: b.id, minutes: 0 }));
  }

  res.json({ ok: true, added, alreadyOwned, unresolved, totals: stats.totals(req.user.id) });
});

app.delete('/api/library/:id', auth.requireAuth, auth.checkCsrf, (req, res) => {
  const removed = db.removeEntitlement(req.user.id, clean(req.params.id, 60));
  res.json({ ok: true, removed });
});

app.post('/api/progress', auth.requireAuth, auth.checkCsrf, (req, res) => {
  const bookId = clean(req.body.bookId, 60);
  if (!catalog.byId(bookId)) return res.status(404).json({ ok: false, error: 'unknown_book' });
  if (!db.hasEntitlement(req.user.id, bookId)) {
    return res.status(403).json({ ok: false, error: 'not_owned' });
  }
  const minutes = Math.max(0, Math.min(600, Number(req.body.minutes || 0)));
  const percent = Math.max(0, Math.min(100, Number(req.body.percent || 0)));
  const finished = !!req.body.finished;

  const row = db.setProgress(req.user.id, bookId, { minutes, percent, finished });
  if (minutes > 0) db.addEvent(req.user.id, { type: 'read', bookId, minutes });
  res.json({ ok: true, progress: row });
});

app.get('/api/progress/:id', auth.requireAuth, (req, res) => {
  const bookId = clean(req.params.id, 60);
  res.json({ ok: true, progress: db.getProgress(req.user.id, bookId) || { bookId, percent: 0, minutes: 0, finished: false } });
});

app.get('/api/analytics', auth.requireAuth, (req, res) => {
  const days = Math.max(1, Math.min(90, Number(req.query.days || 7)));
  res.json({ ok: true, days, series: stats.series(req.user.id, days), totals: stats.totals(req.user.id) });
});

/* ========================================================================
   Pages
   ===================================================================== */
app.get('/library', auth.requireAuth, (req, res) => {
  const days = Math.max(1, Math.min(90, Number(req.query.days || 7)));
  const owned = db.entitlements(req.user.id).map((e) => {
    const p = db.getProgress(req.user.id, e.bookId);
    return {
      book: catalog.byId(e.bookId) || { id: e.bookId, title: e.bookId, catName: '', subtitle: '', img: 'b01' },
      percent: (p && p.percent) || 0,
      minutes: (p && p.minutes) || 0,
      finished: !!(p && p.finished)
    };
  }).sort((a, b) => (a.finished === b.finished ? b.minutes - a.minutes : a.finished ? 1 : -1));

  res.send(pages.libraryPage({
    user: req.user,
    csrf: res.locals.csrf,
    csrfForJs: res.locals.csrf,
    stats: stats.totals(req.user.id),
    series: stats.series(req.user.id, days),
    owned,
    catalog: catalog.load(),
    added: Number(req.query.added || 0),
    ownedCount: Number(req.query.owned || 0)
  }));
});

app.get('/read/:id', auth.requireAuth, (req, res) => {
  const bookId = clean(req.params.id, 60);
  const book = catalog.byId(bookId);
  if (!book) {
    return res.status(404).send(pages.simplePage({
      user: req.user, csrf: res.locals.csrf, title: 'Not found', heading: 'That ebook does not exist',
      text: 'The link may be out of date.', cta: { href: '/library', label: 'Back to my library' }
    }));
  }
  if (!db.hasEntitlement(req.user.id, bookId)) {
    return res.status(403).send(pages.simplePage({
      user: req.user, csrf: res.locals.csrf, title: 'Not in your library',
      heading: 'You do not own this ebook yet',
      text: 'Add it from the store and it will open here immediately.',
      cta: { href: '/', label: 'Open the store' }
    }));
  }
  res.send(pages.readerPage({
    user: req.user, csrf: res.locals.csrf, book, progress: db.getProgress(req.user.id, bookId)
  }));
});

/* ---- 404 + error ------------------------------------------------------- */
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'not_found' });
  res.status(404).send(pages.simplePage({
    user: req.user, csrf: res.locals.csrf, title: '404', heading: 'Page not found',
    text: 'The page you asked for is not here.', cta: { href: '/', label: 'Go to the store' }
  }));
});

app.use((err, req, res, next) => {   // eslint-disable-line no-unused-vars
  console.error('[error]', err && err.stack ? err.stack : err);
  if (res.headersSent) return;
  if (req.path.startsWith('/api/')) return res.status(500).json({ ok: false, error: 'server_error' });
  res.status(500).send(pages.simplePage({
    user: req.user || null, csrf: res.locals.csrf, title: '500', heading: 'Something broke',
    text: 'The error was logged on the server.', cta: { href: '/', label: 'Back to the store' }
  }));
});

/* ---- boot ------------------------------------------------------------- */
if (require.main === module) {
  auth.assertReady();
  const c = catalog.load();
  app.listen(PORT, () => {
    console.log('Brio listening on http://localhost:' + PORT);
    console.log('  catalog :', c.cats.length + ' categories /', c.ebooks.length + ' ebooks');
    console.log('  store   :', db.FILE);
    console.log('  env     :', process.env.NODE_ENV || 'development');
    console.log('  sign in : /login' + (db.userCount() ? '' : '  (no accounts yet — run `npm run seed`)'));
  });
}

module.exports = app;
