'use strict';
/* ---------------------------------------------------------------------------
   Idempotent seed.

     npm run seed            → creates the demo account if it does not exist
     npm run seed -- --force  → wipes demo state and rebuilds it

   Creates:
     * one test account with a known email + password (scrypt hashed)
     * entitlements to 6 ebooks across different categories
     * progress rows (one finished, the rest part-read)
     * 14 days of reading/listening events so the analytics panel has a real
       series to roll up. These are seeded demo events and the dashboard says so.
   --------------------------------------------------------------------------- */
const auth = require('../server/auth');
const db = require('../server/db');
const catalog = require('../server/catalog');

const FORCE = process.argv.includes('--force');
const EMAIL = process.env.DEMO_EMAIL || 'demo@brio.app';
const PASSWORD = process.env.DEMO_PASSWORD || 'BrioDemo!2026';
const NAME = process.env.DEMO_NAME || 'Demo Reader';

const BACKFILL_BOOKS = 6;
const DAY = 86400000;

/* deterministic pseudo-random so repeated seeds look the same */
let seedState = 42;
function rnd() { seedState = (seedState * 1103515245 + 12345) % 2147483648; return seedState / 2147483648; }
const between = (a, b) => Math.floor(a + rnd() * (b - a + 1));

function run() {
  db.load();

  const existing = db.findUserByEmail(EMAIL);
  if (existing && !FORCE) {
    console.log('seed: account already present —', EMAIL, '(nothing changed)');
    console.log('seed: use `npm run seed -- --force` to rebuild demo state');
    return { skipped: true, user: existing.email };
  }

  if (existing && FORCE) {
    const d = db.load();
    d.users = d.users.filter((u) => u.id !== existing.id);
    ['entitlements', 'progress', 'events', 'purchases'].forEach((k) => {
      d[k] = d[k].filter((r) => r.userId !== existing.id);
    });
    db.save();
    console.log('seed: --force removed previous demo state');
  }

  const user = db.createUser({ email: EMAIL, name: NAME, passwordHash: auth.hashPassword(PASSWORD) });

  /* pick a spread of books: one per category, first N categories */
  const picked = [];
  const perCat = {};
  catalog.books().forEach((b) => {
    perCat[b.cat] = perCat[b.cat] || 0;
    if (perCat[b.cat] === 0 && picked.length < BACKFILL_BOOKS) {
      picked.push(b);
      perCat[b.cat] = 1;
    }
  });

  picked.forEach((b, i) => {
    db.addEntitlement(user.id, b.id, 'seed');
    const finished = i === 2;
    const percent = finished ? 100 : between(8, 78);
    db.setProgress(user.id, b.id, { percent, minutes: between(12, 55), finished });
  });

  /* 14 days of activity; today always has reading time so the tiles are alive */
  const rows = [];
  for (let i = 13; i >= 0; i--) {
    const at = new Date(Date.now() - i * DAY);
    const dow = at.getUTCDay();
    const quiet = i !== 0 && (i % 5 === 3 || dow === 0);
    if (!quiet) {
      const book = picked[between(0, picked.length - 1)];
      at.setUTCHours(between(7, 21), between(0, 59), 0, 0);
      rows.push({ type: 'read', bookId: book ? book.id : null, minutes: between(9, 46), at: at.toISOString() });
      if (i % 3 === 0) {
        rows.push({
          type: 'listen',
          bookId: book ? book.id : null,
          minutes: between(4, 19),
          at: new Date(at.getTime() + 3600000).toISOString()
        });
      }
    }
  }
  db.addEvents(user.id, rows);

  db.addPurchase(user.id, {
    provider: 'none',
    amountCents: picked.length * Number(process.env.EBOOK_PRICE_CENTS || 200),
    currency: process.env.CURRENCY || 'USD',
    status: 'seed'
  });

  console.log('seed: created test account');
  console.log('  email    :', EMAIL);
  console.log('  password :', PASSWORD);
  console.log('  library  : ' + picked.length + ' ebooks owned');
  console.log('  activity : ' + rows.length + ' seeded events over 14 days');
  console.log('  db file  : ' + db.FILE);
  return { created: true, user: user.email, books: picked.length, events: rows.length };
}

if (require.main === module) {
  try {
    run();
  } catch (e) {
    console.error('seed failed:', e.message);
    process.exit(1);
  }
}

module.exports = run;
