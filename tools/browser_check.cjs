#!/usr/bin/env node
// Browser checks for the top-bar mode control and the unit menu, in WebKit
// (iPad, touch) and Chromium (phone at 390, desktop at 1200).
//
//   python3 -m http.server 8731 &       # from the repo root
//   PLAYWRIGHT=/path/to/node_modules/playwright node tools/browser_check.cjs http://127.0.0.1:8731
//
// The mode control and term boxes come from the hub's assets/terms.js, loaded
// by absolute URL. To test against a local hub checkout before it is live:
//
//   AITOOLS_HUB=~/gits/idvorkin-ai-tools.github.io PLAYWRIGHT=… node tools/browser_check.cjs
//
// which serves https://idvorkin-ai-tools.github.io/ from disk (this repo under
// /llm-judges-field-map/, the hub everywhere else), so every map shares one
// origin as it does live, and checks the mode carries to the hub's test page.
//
// Not a node:test file on purpose: `node --test tools/` stays browser-free.
// Exits 1 on any failure.
const fs = require('fs'), path = require('path');
const pw = require(process.env.PLAYWRIGHT || 'playwright');
const HUB = process.env.AITOOLS_HUB;
const ORIGIN = 'https://idvorkin-ai-tools.github.io';
const BASE = HUB ? ORIGIN + '/llm-judges-field-map' : (process.argv[2] || 'http://127.0.0.1:8731').replace(/\/$/, '');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
async function serveLocal(ctx) {
  const map = path.resolve(__dirname, '..');
  await ctx.route(ORIGIN + '/**', r => {
    let p = decodeURIComponent(new URL(r.request().url()).pathname);
    let f = p.startsWith('/llm-judges-field-map/') ? path.join(map, p.slice(22)) : path.join(HUB, p);
    if (f.endsWith('/')) f += 'index.html';
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return r.fulfill({ status: 404, body: 'not found' });
    return r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'access-control-allow-origin': '*' } });
  });
}
const ONLY = process.argv[3]; // optional: webkit | chromium
let fails = 0;
function ok(cond, msg) { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) fails++; }

const CONFIGS = [
  { name: 'webkit iPad Pro 11', engine: 'webkit', ctx: () => ({ ...pw.devices['iPad Pro 11'] }) },
  { name: 'chromium phone 390', engine: 'chromium', ctx: () => ({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 }) },
  { name: 'chromium desktop 1200', engine: 'chromium', ctx: () => ({ viewport: { width: 1200, height: 900 } }) },
];

async function open(ctx, path, errs) {
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(path + ': ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(path + ': ' + m.text()); });
  await p.goto(BASE + '/' + path);
  await p.waitForSelector('.gl-box', { state: 'attached' }).catch(() => {});
  await p.evaluate(() => {
    window.__ev = 0;
    window.addEventListener('storage', e => { if (e.key === 'aitools-mode') window.__ev++; });
  });
  return p;
}
const press = (p, touch, sel) => (touch ? p.locator(sel).tap() : p.locator(sel).click());
const state = p => p.evaluate(() => ({
  mode: (localStorage.getItem('aitools-mode')),
  tech: document.documentElement.getAttribute('data-tech'),
  eli5: document.documentElement.getAttribute('data-eli5'),
  checked: [...document.querySelectorAll('.modesel [aria-checked=true]')].map(b => b.dataset.mode),
  toast: (document.querySelector('.gl-toast.gl-show') || {}).textContent || '',
  ev: window.__ev,
}));

async function run(cfg) {
  console.log('\n== ' + cfg.name);
  const browser = await pw[cfg.engine].launch();
  const ctx = await browser.newContext(cfg.ctx());
  if (HUB) await serveLocal(ctx);
  const touch = !!cfg.ctx().hasTouch;
  const errs = [];
  const a = await open(ctx, 'parts/p07.html', errs);
  const b = await open(ctx, 'parts/p02.html', errs);
  const c = await open(ctx, 'parts/math.html', errs);

  // control shape
  const segs = await a.$$eval('.modesel button', bs => bs.map(x => { const r = x.getBoundingClientRect(); return { m: x.dataset.mode, w: r.width, h: r.height, vis: r.width > 0 }; }));
  ok(segs.map(s => s.m).join() === 'plain,tech,eli5', 'three segments Plain/Technical/ELI5: ' + segs.map(s => s.m).join());
  ok(segs.every(s => s.w >= 44 && s.h >= 44), '44px targets: ' + segs.map(s => Math.round(s.w) + 'x' + Math.round(s.h)).join(' '));
  ok((await state(a)).checked.join() === 'plain', 'Plain selected by default');
  ok(!(await a.$('input.pref-tech')), 'old checkboxes gone');

  // each tap selects exactly its own mode and changes visible text now
  const seq = ['tech', 'eli5', 'eli5', 'plain', 'tech', 'plain'];
  for (const m of seq) {
    await press(a, touch, `.modesel button[data-mode=${m}]`);
    await a.waitForTimeout(60);
    const s = await state(a);
    ok(s.checked.join() === m && s.mode === m && (s.tech === 'on') === (m === 'tech') && (s.eli5 === 'on') === (m === 'eli5'),
      `tap ${m}: checked=${s.checked} stored=${s.mode} html tech=${s.tech} eli5=${s.eli5}`);
    ok(new RegExp('^' + { plain: 'Plain', tech: 'Technical', eli5: 'ELI5' }[m] + ' mode').test(s.toast), `toast names the mode: "${s.toast.slice(0, 60)}"`);
    const vis = await a.evaluate(m => {
      const cls = { plain: '.gl-plain', tech: '.gl-tech', eli5: '.gl-eli5' }[m];
      const boxes = [...document.querySelectorAll('.gl-box')];
      return boxes.length > 0 && boxes.every(x => getComputedStyle(x.querySelector(cls)).display !== 'none' &&
        ['.gl-plain', '.gl-tech', '.gl-eli5'].filter(k => k !== cls).every(k => [...x.querySelectorAll(k)].every(e => getComputedStyle(e).display === 'none')));
    }, m);
    ok(vis, `${m}: every term box is set to show only the ${m} text`);
    const seen = await a.evaluate(() => [...document.querySelectorAll('.gl-box')].some(x => { const r = x.getBoundingClientRect(); return r.height > 0 && r.bottom > 0 && r.top < innerHeight; }) ||
      !!document.querySelector('.gl-toast.gl-show .gl-toast-ex'));
    ok(seen, `${m}: changed text is on screen (a box in view, or a sample in the toast)`);
  }

  // other tabs follow, quietly, with no echo
  await a.waitForTimeout(1500);
  for (const [name, p] of [['p02', b], ['math', c]]) {
    const s = await state(p);
    ok(s.checked.join() === 'plain' && !s.tech && !s.eli5, `${name} followed to plain: checked=${s.checked}`);
    ok(s.ev === seq.filter((m, i) => m !== (seq[i - 1] || 'plain')).length, `${name} got one storage event per real change, no echoes: ${s.ev}`);
    ok(!s.toast, `${name} shows no toast for a synced change`);
  }
  ok((await state(a)).ev === 0, 'tapping tab gets no storage events back (no echo): ' + (await state(a)).ev);
  // tap in tab B, A follows
  await b.bringToFront();
  const bev = (await state(b)).ev;
  await press(b, touch, '.modesel button[data-mode=eli5]');
  await b.waitForTimeout(800);
  const sa = await state(a);
  ok(sa.checked.join() === 'eli5' && sa.eli5 === 'on', 'p07 followed a tap on p02: ' + sa.checked);
  await b.waitForTimeout(1500);
  ok((await state(b)).ev === bev, 'p02 got no echo back');
  await a.bringToFront();

  // busy tabs (like throttled background tabs on iPad) must not echo stale values
  for (const p of [b, c]) await p.evaluate(() => { window.__ev = 0; });
  await a.evaluate(() => { window.__ev = 0; });
  b.evaluate(() => setTimeout(() => { const t = Date.now(); while (Date.now() - t < 700); }, 0)).catch(() => {});
  c.evaluate(() => setTimeout(() => { const t = Date.now(); while (Date.now() - t < 1100); }, 0)).catch(() => {});
  await a.waitForTimeout(50);
  for (const m of ['tech', 'plain', 'eli5']) { await press(a, touch, `.modesel button[data-mode=${m}]`); await a.waitForTimeout(120); }
  await a.waitForTimeout(2500);
  const busy = [await state(a), await state(b), await state(c)];
  ok(busy[0].ev === 0 && busy[1].ev === 3 && busy[2].ev === 3 && busy.every(s => s.checked.join() === 'eli5'),
    'busy tabs: no echo, all settle on ELI5 (events ' + busy.map(s => s.ev).join('/') + ')');

  // keyboard: arrows move the selection
  await a.focus('.modesel button[aria-checked=true]');
  await a.keyboard.press('ArrowLeft');
  ok((await state(a)).checked.join() === 'tech', 'ArrowLeft from ELI5 selects Technical');

  // no horizontal overflow
  for (const [name, p] of [['p07', a], ['p02', b], ['math', c]]) {
    const ov = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    ok(ov[0] <= ov[1], `${name} no horizontal scroll (${ov[0]} <= ${ov[1]})`);
  }

  // unit menu behind the kicker
  const btn = 'main .eyebrow .toc-btn';
  const bb = await a.$eval(btn, x => { const r = x.getBoundingClientRect(); return [r.width, r.height]; });
  ok(bb[1] >= 44, 'kicker button is 44px tall: ' + Math.round(bb[1]));
  await press(a, touch, btn);
  const menu = await a.evaluate(() => {
    const n = document.getElementById('toc-pop'), r = n.getBoundingClientRect();
    const links = [...n.querySelectorAll('a')];
    return { open: !n.hidden, units: n.querySelectorAll('.toc-units > li').length, cur: (n.querySelector('[aria-current=page]') || {}).textContent,
      secs: n.querySelectorAll('.toc-secs a').length, h2: document.querySelectorAll('main h2[id]').length,
      small: links.filter(l => l.getBoundingClientRect().height < 44).length, right: r.right, left: r.left, vw: innerWidth,
      expanded: document.querySelector('.toc-btn').getAttribute('aria-expanded') };
  });
  ok(menu.open && menu.expanded === 'true', 'tap on kicker opens the menu');
  ok(menu.units === 10, 'lists all 10 units: ' + menu.units);
  ok(/07/.test(menu.cur || ''), 'current unit marked: ' + menu.cur);
  ok(menu.secs === menu.h2 && menu.h2 > 0, `lists this unit's sections: ${menu.secs}/${menu.h2}`);
  ok(menu.small === 0, 'every menu link is at least 44px tall');
  ok(menu.left >= 0 && menu.right <= menu.vw, `menu inside the viewport (${Math.round(menu.left)}..${Math.round(menu.right)} of ${menu.vw})`);
  await press(a, touch, '#toc-pop .toc-secs a[href="#drift"]');
  await a.waitForFunction(() => { const t = document.getElementById('drift').getBoundingClientRect().top; return t >= 0 && t < 200; }, null, { polling: 100, timeout: 5000 }).catch(() => {});
  const jumped = await a.evaluate(() => ({ hash: location.hash, top: Math.round(document.getElementById('drift').getBoundingClientRect().top), hidden: document.getElementById('toc-pop').hidden }));
  ok(jumped.hash === '#drift' && jumped.top >= 0 && jumped.top < 200 && jumped.hidden, `section link jumps and closes: ${JSON.stringify(jumped)}`);
  await a.focus(btn);
  await a.keyboard.press('Enter');
  await a.keyboard.press('ArrowDown');
  await a.keyboard.press('Escape');
  const esc = await a.evaluate(() => ({ hidden: document.getElementById('toc-pop').hidden, focus: document.activeElement.classList.contains('toc-btn') }));
  ok(esc.hidden && esc.focus, 'Esc closes the menu and returns focus to the kicker');
  await c.bringToFront();
  await press(c, touch, btn);
  ok(await c.evaluate(() => /A/.test(document.querySelector('#toc-pop [aria-current=page]').textContent)), 'appendix page marks itself current');
  await press(c, touch, '#toc-pop a[href="p03.html"]');
  await c.waitForURL(/p03\.html$/, { timeout: 5000 }).catch(() => {});
  ok(/p03\.html$/.test(c.url()), 'unit link navigates: ' + c.url());

  // the mode follows the reader to another map on the same origin
  if (HUB) {
    await press(a, touch, '.modesel button[data-mode=tech]');
    const d = await ctx.newPage();
    d.on('pageerror', e => errs.push('terms-demo: ' + e.message));
    await d.goto(ORIGIN + '/assets/terms-demo.html');
    await d.waitForSelector('.modesel');
    const dm = await d.evaluate(() => ({ tech: document.documentElement.getAttribute('data-tech'), checked: document.querySelector('.modesel [aria-checked=true]').dataset.mode, floating: document.querySelector('.modesel').classList.contains('aitm-float') }));
    ok(dm.tech === 'on' && dm.checked === 'tech' && dm.floating, 'Technical set on a judges page shows on the hub test page: ' + JSON.stringify(dm));
    await d.close();
  }

  // the old judges key is a read-only fallback
  const m = await ctx.newPage();
  await m.goto(BASE + '/parts/p04.html');
  await m.evaluate(() => { localStorage.removeItem('aitools-mode'); localStorage.setItem('llm-judges-mode', 'tech'); });
  await m.reload();
  await m.waitForSelector('.modesel');
  const mig = await m.evaluate(() => ({ checked: document.querySelector('.modesel [aria-checked=true]').dataset.mode, stored: localStorage.getItem('aitools-mode'), old: localStorage.getItem('llm-judges-mode') }));
  ok(mig.checked === 'tech' && mig.stored === null && mig.old === 'tech', 'old llm-judges-mode shows as Technical without writing storage: ' + JSON.stringify(mig));
  await m.evaluate(() => localStorage.removeItem('llm-judges-mode'));

  ok(errs.length === 0, 'no console errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
}

(async () => {
  for (const cfg of CONFIGS) if (!ONLY || cfg.engine === ONLY) await run(cfg);
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
