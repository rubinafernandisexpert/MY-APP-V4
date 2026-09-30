'use strict';
/* Catalog access layer. Reads data/catalog.json; if it is missing it builds it
   on the fly so the server can never boot into a broken state. */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'data', 'catalog.json');
let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch (e) {
    cache = require('../scripts/build-catalog')();
  }
  if (!cache || !Array.isArray(cache.ebooks)) throw new Error('catalog is empty');
  return cache;
}

const books = () => load().ebooks;
const cats = () => load().cats;
const articles = () => load().articles;
const byId = (id) => books().find((b) => b.id === id) || null;
const byTitle = (t) => {
  const n = String(t || '').trim().toLowerCase();
  return books().find((b) => b.title.toLowerCase() === n) || null;
};
function catCounts() {
  const m = {};
  books().forEach((b) => { m[b.cat] = (m[b.cat] || 0) + 1; });
  return m;
}

module.exports = { load, books, cats, articles, byId, byTitle, catCounts };
