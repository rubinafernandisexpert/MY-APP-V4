'use strict';
/* ---------------------------------------------------------------------------
   Builds data/catalog.json from the storefront's catalog source of truth
   (public/assets/js/content/catalog.js) by evaluating it in a sandbox.

   Shape-agnostic on purpose: it tolerates the catalog exposing either
   `desc` or `description`, string or array bodies, ids or slugs.

     node scripts/build-catalog.js
   --------------------------------------------------------------------------- */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'assets', 'js', 'content', 'catalog.js');
const OUT = path.join(ROOT, 'data', 'catalog.json');

function build() {
  if (!fs.existsSync(SRC)) throw new Error('catalog source not found: ' + SRC);
  const src = fs.readFileSync(SRC, 'utf8');

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'catalog.js' });
  const w = sandbox.window || {};

  const cats = (w.BRIO_CATS || []).map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon || '',
    c1: c.c1 || '#7C5CFF',
    c2: c.c2 || '#22C1FF',
    blurb: c.blurb || ''
  }));

  const catName = {};
  cats.forEach((c) => { catName[c.id] = c.name; });

  const raw = w.BRIO_EBOOKS || [];
  const ebooks = raw.map((b, i) => {
    const body = b.desc || b.description || b.body || [];
    const tags = Array.isArray(b.tags) ? b.tags : [];
    return {
      id: String(b.id || b.slug || ('bk' + String(i + 1).padStart(3, '0'))),
      cat: String(b.cat || ''),
      catName: catName[b.cat] || b.catName || String(b.cat || ''),
      title: String(b.title || ('Untitled ' + (i + 1))),
      subtitle: String(b.subtitle || b.blurb || b.tagline || ''),
      desc: Array.isArray(body) ? body.filter(Boolean).join(' ') : String(body || ''),
      img: String(b.img || b.image || ('b' + String((i % 24) + 1).padStart(2, '0'))),
      pages: Number(b.pages || 0),
      rating: Number(b.rating || 0),
      readers: Number(b.readers || 0),
      tags
    };
  });

  const articles = (w.BRIO_ARTICLES || []).map((a) => ({
    slug: a.slug || '',
    title: a.title || '',
    excerpt: a.excerpt || '',
    cat: a.cat || '',
    img: a.img || '',
    mins: Number(a.mins || 0),
    iso: a.iso || ''
  }));

  const out = {
    generatedAt: new Date().toISOString(),
    priceCents: Number(process.env.EBOOK_PRICE_CENTS || 200),
    currency: process.env.CURRENCY || 'USD',
    cats,
    ebooks,
    articles
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  return out;
}

if (require.main === module) {
  const o = build();
  console.log(
    'catalog.json written →',
    o.cats.length + ' categories,',
    o.ebooks.length + ' ebooks,',
    o.articles.length + ' articles'
  );
}

module.exports = build;
