'use strict';
/* Rollups for the personal-library dashboard: 7-day reading series, streak,
   totals. Every number is derived from real rows in db.events — no invented
   values are rendered anywhere in the app. */
const db = require('./db');

const DAY = 86400000;
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

const LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function series(userId, days = 7) {
  const days_ = Math.max(1, Math.min(90, Number(days) || 7));
  const from = new Date(Date.now() - (days_ - 1) * DAY).toISOString().slice(0, 10);
  const map = {};
  for (let i = days_ - 1; i >= 0; i--) {
    const k = dayKey(Date.now() - i * DAY);
    map[k] = { date: k, label: LABELS[new Date(k + 'T00:00:00Z').getUTCDay()], read: 0, listen: 0, total: 0 };
  }
  db.eventsSince(userId, from + 'T00:00:00.000Z').forEach((e) => {
    const k = String(e.at).slice(0, 10);
    if (!map[k]) return;
    if (e.type === 'listen') map[k].listen += Number(e.minutes || 0);
    else map[k].read += Number(e.minutes || 0);
    map[k].total = map[k].read + map[k].listen;
  });
  return Object.values(map);
}

/* Consecutive days with activity, counting back from today. A quiet today does
   not break a streak that is still alive yesterday. */
function streak(userId) {
  const s = series(userId, 60);
  let n = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i].total > 0) n++;
    else if (i === s.length - 1) continue;
    else break;
  }
  return n;
}

function totals(userId) {
  const owned = db.entitlements(userId);
  const progress = db.progressFor(userId);
  const week = series(userId, 7);
  const events = db.eventsAll(userId);
  const minutesAll = events.reduce((a, e) => a + Number(e.minutes || 0), 0);
  return {
    booksOwned: owned.length,
    booksFinished: progress.filter((p) => p.finished).length,
    booksStarted: progress.filter((p) => (p.percent || 0) > 0).length,
    minutesToday: week.length ? week[week.length - 1].total : 0,
    minutes7d: week.reduce((a, d) => a + d.total, 0),
    minutesAll,
    sessions: events.length,
    streak: streak(userId)
  };
}

module.exports = { series, streak, totals, dayKey };
