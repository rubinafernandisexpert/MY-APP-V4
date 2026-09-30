'use strict';
/* ---------------------------------------------------------------------------
   Persistence — a JSON document store with atomic writes.

   Deliberately dependency-free so the app runs with no database. It is safe
   for a single Node process serving a demo or a small shop. The equivalent
   SQL schema (same entity + field names) is in db/schema.sql; port this file
   to Postgres/SQLite before running more than one instance.
   --------------------------------------------------------------------------- */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = process.env.DB_FILE
  ? path.resolve(process.cwd(), process.env.DB_FILE)
  : path.join(__dirname, '..', 'data', 'db.json');

const EMPTY = { users: [], entitlements: [], progress: [], events: [], purchases: [] };

let db = null;

function load() {
  if (db) return db;
  try {
    db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    db = JSON.parse(JSON.stringify(EMPTY));
  }
  Object.keys(EMPTY).forEach((k) => { if (!Array.isArray(db[k])) db[k] = []; });
  return db;
}

function save() {
  const d = load();
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
  fs.renameSync(tmp, FILE);   // atomic swap — never leaves a half-written file
}

const newId = (p) => p + '_' + crypto.randomBytes(8).toString('hex');
const nowIso = () => new Date().toISOString();

/* ---- users ------------------------------------------------------------- */
const norm = (e) => String(e || '').trim().toLowerCase();
const findUserByEmail = (email) => load().users.find((u) => u.email === norm(email)) || null;
const findUserById = (id) => load().users.find((u) => u.id === id) || null;
const userCount = () => load().users.length;

function createUser({ email, name, passwordHash }) {
  const d = load();
  const u = {
    id: newId('usr'),
    email: norm(email),
    name: name || norm(email).split('@')[0],
    passwordHash,
    createdAt: nowIso(),
    lastLoginAt: null
  };
  d.users.push(u);
  save();
  return u;
}

function touchLogin(userId) {
  const u = findUserById(userId);
  if (u) { u.lastLoginAt = nowIso(); save(); }
  return u;
}

/* ---- entitlements ------------------------------------------------------ */
const entitlements = (userId) => load().entitlements.filter((e) => e.userId === userId);
const hasEntitlement = (userId, bookId) =>
  load().entitlements.some((e) => e.userId === userId && e.bookId === bookId);

function addEntitlement(userId, bookId, source) {
  if (hasEntitlement(userId, bookId)) return { created: false };
  const d = load();
  const e = {
    id: newId('ent'),
    userId,
    bookId,
    source: source || 'checkout',
    createdAt: nowIso()
  };
  d.entitlements.push(e);
  save();
  return { created: true, entitlement: e };
}

function removeEntitlement(userId, bookId) {
  const d = load();
  const before = d.entitlements.length;
  d.entitlements = d.entitlements.filter((e) => !(e.userId === userId && e.bookId === bookId));
  if (d.entitlements.length !== before) { save(); return true; }
  return false;
}

/* ---- progress ---------------------------------------------------------- */
const getProgress = (userId, bookId) =>
  load().progress.find((p) => p.userId === userId && p.bookId === bookId) || null;

function setProgress(userId, bookId, patch) {
  const d = load();
  let row = d.progress.find((p) => p.userId === userId && p.bookId === bookId);
  if (!row) {
    row = { userId, bookId, percent: 0, minutes: 0, finished: false, updatedAt: nowIso() };
    d.progress.push(row);
  }
  if (typeof patch.percent === 'number') {
    row.percent = Math.max(row.percent || 0, Math.min(100, Math.round(patch.percent)));
  }
  if (typeof patch.minutes === 'number') row.minutes = (row.minutes || 0) + Math.max(0, Math.round(patch.minutes));
  if (patch.finished) { row.finished = true; row.percent = 100; }
  row.updatedAt = nowIso();
  save();
  return row;
}

const progressFor = (userId) => load().progress.filter((p) => p.userId === userId);

/* ---- events (activity log) -------------------------------------------- */
function addEvent(userId, { type, bookId, minutes, at }) {
  const d = load();
  const row = {
    id: newId('evt'),
    userId,
    type: type === 'listen' ? 'listen' : 'read',
    bookId: bookId || null,
    minutes: Number(minutes || 0),
    at: at || nowIso()
  };
  d.events.push(row);
  save();
  return row;
}
const addEvents = (userId, rows) => rows.map((r) => addEvent(userId, r));

function eventsSince(userId, iso) {
  const t = new Date(iso).getTime();
  return load().events.filter((e) => e.userId === userId && new Date(e.at).getTime() >= t);
}
const eventsAll = (userId) => load().events.filter((e) => e.userId === userId);

/* ---- purchases --------------------------------------------------------- */
function addPurchase(userId, { provider, reference, amountCents, currency, status }) {
  const d = load();
  const row = {
    id: newId('pur'),
    userId,
    provider: provider || 'none',
    reference: reference || null,
    amountCents: Number(amountCents || 0),
    currency: currency || 'USD',
    status: status || 'placeholder',
    createdAt: nowIso()
  };
  d.purchases.push(row);
  save();
  return row;
}
const purchases = (userId) => load().purchases.filter((p) => p.userId === userId);

module.exports = {
  FILE, load, save,
  findUserByEmail, findUserById, createUser, touchLogin, userCount,
  entitlements, hasEntitlement, addEntitlement, removeEntitlement,
  getProgress, setProgress, progressFor,
  addEvent, addEvents, eventsSince, eventsAll,
  addPurchase, purchases
};
