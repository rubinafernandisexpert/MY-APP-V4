'use strict';
/* ---------------------------------------------------------------------------
   Server-rendered pages: sign in, create account, personal library, reader.
   No inline script anywhere — every page loads an external file under
   /assets/js/ so the CSP can stay `script-src 'self'`.
   --------------------------------------------------------------------------- */
const cat = require('./catalog');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

const CSS = `
:root{--pink:#FF2D9B;--purple:#7C5CFF;--cyan:#22C1FF;--green:#00C46A;--yellow:#FFD23D;
--ink:#1C1030;--ink2:#4A3B63;--muted:#7A6C92;--line:rgba(28,16,48,.10);--card:rgba(255,255,255,.86)}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:#FFF7FD;color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;
background:
radial-gradient(900px 520px at 8% -6%,rgba(255,45,155,.16),transparent 60%),
radial-gradient(820px 520px at 96% 2%,rgba(34,193,255,.16),transparent 62%),
radial-gradient(760px 520px at 50% 108%,rgba(0,196,106,.14),transparent 62%),
linear-gradient(transparent 96%,rgba(124,92,255,.05) 96%) 0 0/100% 46px}
a{color:var(--purple);text-decoration:none}
a:hover{text-decoration:underline}
h1,h2,h3{line-height:1.16;margin:0 0 .4em;letter-spacing:-.02em}
h1{font-size:clamp(30px,4.4vw,46px)}
h2{font-size:clamp(22px,2.6vw,30px)}
p{margin:0 0 1em;color:var(--ink2)}
.wrap{max-width:1120px;margin:0 auto;padding:0 22px}
header.top{position:sticky;top:0;z-index:20;backdrop-filter:blur(12px);
background:rgba(255,252,255,.86);border-bottom:1px solid var(--line)}
header.top .wrap{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding-top:12px;padding-bottom:12px}
.brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:19px;color:var(--ink)}
.brand i{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-style:normal;font-size:16px;
background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff}
nav.links{display:flex;align-items:center;gap:16px;margin-left:auto;flex-wrap:wrap}
nav.links a{font-weight:600;font-size:14.5px;color:var(--ink2)}
nav.links a.on{color:var(--pink)}
nav.links form{margin:0}
nav.links button{font:600 14px/1 inherit;color:var(--ink2);background:none;border:1px solid var(--line);
padding:9px 13px;border-radius:999px;cursor:pointer}
nav.links button:hover{border-color:var(--pink);color:var(--pink)}
.who{font-size:13px;color:var(--muted);max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
main{padding:34px 0 70px}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;
box-shadow:0 18px 46px rgba(124,92,255,.09)}
.grid{display:grid;gap:18px}
.tiles{grid-template-columns:repeat(auto-fit,minmax(168px,1fr))}
.tile{padding:18px 20px}
.tile b{display:block;font-size:31px;line-height:1.1;letter-spacing:-.03em}
.tile span{font-size:12.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);font-weight:700}
.tile em{font-style:normal;font-size:12.5px;color:var(--muted)}
.pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;letter-spacing:.03em;
padding:5px 11px;border-radius:999px;background:rgba(124,92,255,.11);color:#4B2EC9}
.pill.g{background:rgba(0,196,106,.13);color:#046B3C}
.pill.b{background:rgba(34,193,255,.15);color:#0B5F86}
.eyebrow{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--pink);margin:0 0 8px}
.banner{display:flex;gap:12px;align-items:center;border-radius:16px;padding:14px 18px;margin-bottom:22px;
background:linear-gradient(90deg,rgba(0,196,106,.13),rgba(34,193,255,.13));border:1px solid rgba(0,196,106,.28);
font-weight:600;color:#065334}
/* analytics */
.chart{display:flex;align-items:flex-end;gap:10px;height:190px;margin:18px 0 6px}
.chart .col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:8px;height:100%}
.chart .bar{width:100%;border-radius:12px 12px 5px 5px;background:linear-gradient(180deg,var(--pink),var(--purple));
height:var(--h,2%);min-height:5px;animation:grow .9s cubic-bezier(.2,.85,.25,1) both;box-shadow:0 8px 20px rgba(124,92,255,.18)}
@keyframes grow{from{height:2%;opacity:.25}to{height:var(--h,2%);opacity:1}}
.chart .lbl{font-size:12px;color:var(--muted);font-weight:600}
.chart .val{font-size:11.5px;font-weight:700;color:var(--ink2)}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}
.note{font-size:12.5px;color:var(--muted);margin-top:14px}
/* books */
.books{grid-template-columns:repeat(auto-fill,minmax(258px,1fr))}
.book{display:flex;flex-direction:column;gap:11px;padding:16px}
.book .cover{aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,var(--purple),var(--cyan))}
.book .cover img{width:100%;height:100%;object-fit:cover;display:block}
.book h3{font-size:17px;margin:0}
.book .sub{font-size:13.5px;color:var(--muted);margin:0}
.meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--muted)}
.prog{height:8px;border-radius:99px;background:rgba(28,16,48,.09);overflow:hidden}
.prog i{display:block;height:100%;width:var(--p,0%);border-radius:99px;
background:linear-gradient(90deg,var(--cyan),var(--green));transition:width .6s ease}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font:600 14.5px/1 inherit;
padding:13px 18px;border-radius:999px;border:0;cursor:pointer;text-decoration:none;
background:linear-gradient(90deg,var(--purple),var(--pink));color:#fff;box-shadow:0 12px 28px rgba(255,45,155,.24)}
.btn:hover{text-decoration:none;transform:translateY(-1px)}
.btn.ghost{background:#fff;color:var(--ink);border:1px solid var(--line);box-shadow:none}
.btn.small{padding:9px 14px;font-size:13.5px}
/* forms */
.form{max-width:470px;margin:0 auto}
label{display:block;font-weight:700;font-size:13.5px;margin:14px 0 6px}
input[type=email],input[type=text],input[type=password]{width:100%;font:16px/1.4 inherit;padding:13px 15px;
border:1px solid var(--line);border-radius:13px;background:#fff;color:var(--ink)}
input:focus{outline:3px solid rgba(124,92,255,.22);border-color:var(--purple)}
.msg{border-radius:13px;padding:12px 15px;font-size:14px;margin-bottom:8px}
.msg.err{background:rgba(255,45,155,.10);color:#9B1156;border:1px solid rgba(255,45,155,.28)}
.msg.ok{background:rgba(0,196,106,.12);color:#046B3C;border:1px solid rgba(0,196,106,.3)}
.demo{margin-top:22px;border:1px dashed rgba(124,92,255,.42);border-radius:15px;padding:15px 17px;
background:rgba(124,92,255,.06);font-size:13.5px;color:var(--ink2)}
.demo b{color:var(--ink)}
.demo code{background:#fff;border:1px solid var(--line);border-radius:7px;padding:2px 7px;font-size:13px}
/* reader */
.reader{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:26px;align-items:start}
.prose p{font-size:17.5px;line-height:1.85;color:#2A1B44}
.prose h2{font-size:23px;margin-top:30px}
.side{position:sticky;top:92px}
.side .card{padding:20px}
footer.foot{border-top:1px solid var(--line);padding:26px 0 40px;color:var(--muted);font-size:13px}
@media(max-width:900px){.reader{grid-template-columns:1fr}.side{position:static}}
@media(max-width:640px){.mapnav{display:none}}
`;

function layout({ title, user, csrf, body, active }) {
  const nav = user
    ? `<a href="/"${active === 'store' ? ' class="on"' : ''}>Store</a>
       <a href="/library"${active === 'library' ? ' class="on"' : ''}>My library</a>
       <span class="who" title="${esc(user.email)}">${esc(user.email)}</span>
       <form method="post" action="/logout">
         <input type="hidden" name="_csrf" value="${esc(csrf)}">
         <button type="submit">Log out</button>
       </form>`
    : `<a href="/"${active === 'store' ? ' class="on"' : ''}>Store</a>
       <a href="/login"${active === 'login' ? ' class="on"' : ''}>Sign in</a>
       <a href="/register"${active === 'register' ? ' class="on"' : ''}>Create account</a>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Brio</title>
<meta name="description" content="Brio — human-written ebooks and your personal library.">
<link rel="icon" href="/assets/img/favicon.svg">
<style>${CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="/"><i>B</i>Brio</a>
  <nav class="links">${nav}</nav>
</div></header>
<main><div class="wrap">
${body}
</div></main>
<footer class="foot"><div class="wrap">
  Every ebook is researched, written and edited by a human. ·
  <a href="/">Browse the store</a> · <a href="/healthz">Status</a>
</div></footer>
</body>
</html>`;
}

/* ---- sign in / register ------------------------------------------------ */
function loginPage({ user, csrf, error, next, notice }) {
  const showDemo = process.env.SHOW_DEMO_CREDENTIALS !== 'false';
  const email = process.env.DEMO_EMAIL || 'demo@brio.app';
  const password = process.env.DEMO_PASSWORD || 'BrioDemo!2026';
  const body = `
  <div class="form card" style="margin-top:26px">
    <p class="eyebrow">Welcome back</p>
    <h1>Sign in to your library</h1>
    <p>Open the books you own, pick up where you stopped, and see your reading analytics.</p>
    ${error ? `<div class="msg err">${esc(error)}</div>` : ''}
    ${notice ? `<div class="msg ok">${esc(notice)}</div>` : ''}
    <form method="post" action="/login">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <input type="hidden" name="next" value="${esc(next || '/library')}">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required autocomplete="username" placeholder="you@example.com">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" required autocomplete="current-password" placeholder="••••••••">
      <div style="margin-top:18px"><button class="btn" type="submit" style="width:100%">Sign in</button></div>
    </form>
    <p style="margin:16px 0 0;font-size:14px">No account yet? <a href="/register">Create one</a> · <a href="/">Back to the store</a></p>
    ${showDemo ? `<div class="demo">
      <b>Test account for this build</b><br>
      Email <code>${esc(email)}</code> · Password <code>${esc(password)}</code><br>
      <button type="button" class="btn ghost small" id="fillDemo" style="margin-top:10px"
        data-email="${esc(email)}" data-password="${esc(password)}">Fill the test account</button>
    </div>` : ''}
  </div>
  <script src="/assets/js/auth-ui.js" defer></script>`;
  return layout({ title: 'Sign in', user, csrf, body, active: 'login' });
}

function registerPage({ user, csrf, error }) {
  const body = `
  <div class="form card" style="margin-top:26px">
    <p class="eyebrow">New here</p>
    <h1>Create your account</h1>
    <p>Your library, progress and analytics live behind this account.</p>
    ${error ? `<div class="msg err">${esc(error)}</div>` : ''}
    <form method="post" action="/register">
      <input type="hidden" name="_csrf" value="${esc(csrf)}">
      <label for="name">Name</label>
      <input id="name" name="name" type="text" autocomplete="name" placeholder="Alex Reader">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" required autocomplete="username" placeholder="you@example.com">
      <label for="password">Password (8 characters minimum)</label>
      <input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="••••••••">
      <div style="margin-top:18px"><button class="btn" type="submit" style="width:100%">Create account</button></div>
    </form>
    <p style="margin:16px 0 0;font-size:14px">Already have one? <a href="/login">Sign in</a></p>
  </div>`;
  return layout({ title: 'Create account', user, csrf, body, active: 'register' });
}

/* ---- personal library -------------------------------------------------- */
function libraryPage({ user, csrf, csrfForJs, stats, series, owned, catalog, added, ownedCount }) {
  const max = Math.max(1, ...series.map((d) => d.total));
  const bars = series.map((d) => {
    const h = Math.round((d.total / max) * 100);
    return `<div class="col" title="${esc(d.date)} — ${d.total} min">
      <span class="val">${d.total || ''}</span>
      <span class="bar" style="--h:${Math.max(d.total ? 6 : 2, h)}%"></span>
      <span class="lbl">${esc(d.label)}</span>
    </div>`;
  }).join('');

  const cards = owned.length ? owned.map((row) => {
    const b = row.book;
    const pct = row.finished ? 100 : row.percent;
    return `<article class="card book">
      <div class="cover"><img src="/assets/img/blog/${esc(b.img)}.jpg" alt="" loading="lazy" width="320" height="180"></div>
      <div class="meta">
        <span class="pill">${esc(cat.byId(b.id) ? b.catName : b.catName)}</span>
        <span class="pill g">✍ Human-written</span>
        ${row.finished ? '<span class="pill b">Finished</span>' : ''}
      </div>
      <h3>${esc(b.title)}</h3>
      <p class="sub">${esc(b.subtitle)}</p>
      <div class="prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <i style="--p:${pct}%"></i>
      </div>
      <div class="meta"><span>${pct}% read</span><span>·</span><span>${row.minutes} min logged</span></div>
      <a class="btn small" href="/read/${encodeURIComponent(b.id)}">${row.finished ? 'Read again' : (pct > 0 ? 'Continue' : 'Start reading')}</a>
    </article>`;
  }).join('') : `<div class="card"><h3>Nothing here yet</h3><p>Add ebooks from the store and they will appear in your library.</p><a class="btn" href="/">Browse the store</a></div>`;

  const continueList = owned.filter((r) => !r.finished && r.percent > 0).slice(0, 4).map((r) => `
    <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)">
      <div style="flex:1;min-width:0">
        <b style="display:block;font-size:15px">${esc(r.book.title)}</b>
        <div class="prog" style="margin-top:8px"><i style="--p:${r.percent}%"></i></div>
      </div>
      <span style="font-size:13px;color:var(--muted);white-space:nowrap">${r.percent}%</span>
      <a class="btn ghost small" href="/read/${encodeURIComponent(r.book.id)}">Continue</a>
    </div>`).join('');

  const body = `
  ${added > 0 ? `<div class="banner">✅ ${added} ebook${added === 1 ? '' : 's'} added to your library${ownedCount ? ` · ${ownedCount} were already yours` : ''}.</div>` : ''}
  <p class="eyebrow">Your personal library</p>
  <h1>Hello, ${esc(user.name)}</h1>
  <p>Everything you own, how far you have read, and how much time you have spent reading this week.</p>

  <section class="grid tiles" style="margin:24px 0 30px">
    <div class="card tile"><span>Books owned</span><b>${stats.booksOwned}</b><em>of ${catalog.ebooks.length} in the store</em></div>
    <div class="card tile"><span>Read today</span><b>${stats.minutesToday} min</b><em>${stats.minutes7d} min in 7 days</em></div>
    <div class="card tile"><span>Day streak</span><b>${stats.streak}</b><em>consecutive days with activity</em></div>
    <div class="card tile"><span>Finished</span><b>${stats.booksFinished}</b><em>${stats.booksStarted} started</em></div>
  </section>

  <section class="card" style="margin-bottom:30px">
    <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">
      <div style="flex:1;min-width:240px">
        <p class="eyebrow" style="margin-bottom:4px">Reading time</p>
        <h2 style="margin-bottom:2px">Last 7 days</h2>
        <p style="margin:0;font-size:14px">Minutes logged per day, reading and listening combined.</p>
      </div>
      <div class="legend">
        <span><i class="dot" style="background:linear-gradient(90deg,var(--pink),var(--purple))"></i>Read</span>
        <span><i class="dot" style="background:var(--cyan)"></i>Listen</span>
      </div>
    </div>
    <div class="chart">${bars}</div>
    <div class="legend" style="margin-top:6px">
      <span>Total in 7 days: <b>${stats.minutes7d} min</b></span>
      <span>All-time: <b>${stats.minutesAll} min</b> across <b>${stats.sessions}</b> sessions</span>
    </div>
    <p class="note">Rolled up from the activity rows stored in this instance. In a fresh install the demo account is seeded with sample events, so the chart is illustrative until you start reading yourself.</p>
  </section>

  ${continueList ? `<section style="margin-bottom:30px">
    <h2>Continue reading</h2>
    <div class="card">${continueList}</div>
  </section>` : ''}

  <section>
    <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:14px">
      <h2 style="margin:0">Your books</h2>
      <span style="font-size:14px;color:var(--muted)">${owned.length} owned · <a href="/">add more from the store</a></span>
    </div>
    <div class="grid books">${cards}</div>
  </section>

  <section class="card" style="margin-top:30px">
    <h2>Account</h2>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      <div><span class="pill">Email</span><p style="margin:10px 0 0">${esc(user.email)}</p></div>
      <div><span class="pill">Member since</span><p style="margin:10px 0 0">${esc(String(user.createdAt).slice(0, 10))}</p></div>
      <div><span class="pill">Last sign-in</span><p style="margin:10px 0 0">${esc(user.lastLoginAt ? String(user.lastLoginAt).slice(0, 16).replace('T', ' ') + ' UTC' : 'just now')}</p></div>
      <div><span class="pill b">Sessions logged</span><p style="margin:10px 0 0">${stats.sessions}</p></div>
    </div>
  </section>`;
  return layout({ title: 'My library', user, csrf: csrfForJs, body, active: 'library' });
}

/* ---- reader ------------------------------------------------------------ */
function readerPage({ user, csrf, book, progress }) {
  const owned = (progress && progress.percent) || 0;
  const finished = !!(progress && progress.finished);
  const preview = (book.desc || '').split(/(?<=\.)\s+/);
  const para = preview.length > 2 ? preview : [book.desc || ''];

  const body = `
  <div style="margin-bottom:20px">
    <a href="/library" style="font-size:14px;font-weight:600">← Back to my library</a>
  </div>
  <div class="reader">
    <article class="card prose">
      <div class="meta" style="margin-bottom:12px">
        <span class="pill">${esc(book.catName)}</span>
        <span class="pill g">✍ Human-written</span>
        <span style="font-size:12.5px;color:var(--muted)">${esc(String(book.rating || ''))} ★ · ${book.readers} readers</span>
      </div>
      <h1>${esc(book.title)}</h1>
      <p style="font-size:18px;color:var(--muted)">${esc(book.subtitle)}</p>
      <h2>Preview</h2>
      ${para.map((p) => `<p>${esc(p)}</p>`).join('')}
      <p class="note" style="border-top:1px solid var(--line);padding-top:14px">
        This is the public preview text for “${esc(book.title)}” in this build — the full manuscript is delivered
        with the purchase. Your reading time on this page is still recorded, so the analytics above show real activity.
      </p>
    </article>
    <aside class="side card" id="reader"
      data-book-id="${esc(book.id)}" data-percent="${owned}" data-finished="${finished}">
      <p class="eyebrow" style="margin-bottom:6px">This session</p>
      <div style="display:flex;align-items:baseline;gap:8px">
        <b id="rdMins" style="font-size:30px;letter-spacing:-.03em">0 min</b>
      </div>
      <div style="margin:12px 0 6px;display:flex;justify-content:space-between;font-size:13px;color:var(--muted)">
        <span>Progress</span><span id="rdPct">${finished ? 100 : owned}%</span>
      </div>
      <div class="prog" id="rdBar" style="--p:${finished ? 100 : owned}%"><i style="--p:${finished ? 100 : owned}%"></i></div>
      <div style="margin-top:16px;display:grid;gap:10px">
        <button class="btn" id="rdDone" type="button">${finished ? 'Finished ✓' : 'Mark as finished'}</button>
        <a class="btn ghost" href="/library">Back to library</a>
      </div>
      <p class="note" id="rdStatus">Time is saved every 30 seconds and when you leave the page.</p>
      <p class="note">Signed in as ${esc(user.email)}.</p>
    </aside>
  </div>
  <script src="/assets/js/reader.js" defer></script>`;
  return layout({ title: book.title, user, csrf, body, active: 'library' });
}

/* ---- errors ------------------------------------------------------------ */
function simplePage({ user, csrf, title, heading, text, cta }) {
  const body = `
  <div class="card" style="max-width:560px;margin:40px auto;text-align:center">
    <p class="eyebrow">${esc(title)}</p>
    <h1>${esc(heading)}</h1>
    <p>${esc(text)}</p>
    <a class="btn" href="${esc(cta.href)}">${esc(cta.label)}</a>
  </div>`;
  return layout({ title, user, csrf, body });
}

module.exports = { layout, loginPage, registerPage, libraryPage, readerPage, simplePage, esc };
