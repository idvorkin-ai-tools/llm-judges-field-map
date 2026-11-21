#!/usr/bin/env node
// Browser checks for the top-bar Plain / Technical / ELI5 control, in WebKit
// (iPad, touch) and Chromium (phone at 390, desktop at 1200).
//
//   python3 -m http.server 8731 &       # from the repo root
//   PLAYWRIGHT=/path/to/node_modules/playwright node tools/browser_check.cjs http://127.0.0.1:8731
//
// Not a node:test file on purpose: `node --test tools/` stays browser-free.
// Exits 1 on any failure.
const pw = require(process.env.PLAYWRIGHT || 'playwright');
const BASE = (process.argv[2] || 'http://127.0.0.1:8731').replace(/\/$/, '');
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
    window.addEventListener('storage', e => { if (e.key === 'llm-judges-mode') window.__ev++; });
  });
  return p;
}
const press = (p, touch, sel) => (touch ? p.locator(sel).tap() : p.locator(sel).click());
const state = p => p.evaluate(() => ({
  mode: (localStorage.getItem('llm-judges-mode')),
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

  // old keys migrate (read only)
  const m = await ctx.newPage();
  await m.goto(BASE + '/parts/p04.html');
  await m.evaluate(() => { localStorage.removeItem('llm-judges-mode'); localStorage.setItem('llm-judges-tech', 'on'); });
  await m.reload();
  await m.waitForSelector('.modesel');
  const mig = await m.evaluate(() => ({ checked: document.querySelector('.modesel [aria-checked=true]').dataset.mode, stored: localStorage.getItem('llm-judges-mode') }));
  ok(mig.checked === 'tech' && mig.stored === null, 'old Technical key shows as Technical without writing storage: ' + JSON.stringify(mig));

  ok(errs.length === 0, 'no console errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
}

(async () => {
  for (const cfg of CONFIGS) if (!ONLY || cfg.engine === ONLY) await run(cfg);
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
