// Shared helpers for the interactive widgets. See docs/INTERACTIVE.md.
// A widget lives in widgets/<name>.js and calls LLMJWidgets.register('<name>', fn);
// fn(el) builds into every <div class="lab" data-lab="<name>"></div> on the page.
// Maths lives in lab.js / lab/<name>.js (tested under tools/tests/); widgets only draw.
// Domain words are emitted as .mx groups with all five [data-m] variants, so the
// metaphor menu switches them through paper.css like any other text.
(function () {
  var KEYS = ['hire', 'review', 'wine', 'med', 'ump'];
  var W = {
    A: { hire: 'Ana', review: 'Carla', wine: 'Elodie', med: 'Dr Gale', ump: 'Ivo' },
    B: { hire: 'Ben', review: 'Dev', wine: 'Femi', med: 'Dr Hart', ump: 'June' },
    yes: { hire: 'hire', review: 'exceeds', wine: 'medal', med: 'recall', ump: 'strike' },
    no: { hire: 'no hire', review: 'meets', wine: 'no medal', med: 'clear', ump: 'ball' },
    items: { hire: 'candidates', review: 'employees', wine: 'wines', med: 'mammograms', ump: 'pitches' },
    judge: { hire: 'interviewer', review: 'manager', wine: 'judge', med: 'radiologist', ump: 'umpire' },
    tYes: { hire: 'should hire', review: 'panel: exceeds', wine: 'panel: medal', med: 'cancer', ump: 'true strike' },
    tNo: { hire: 'should not hire', review: 'panel: meets', wine: 'panel: no medal', med: 'no cancer', ump: 'true ball' }
  };
  // HTML: one span per domain inside an .mx wrapper. fn maps a domain key to its text.
  function mx(fn) {
    return '<span class="mx">' + KEYS.map(function (k) { return '<span data-m="' + k + '">' + fn(k) + '</span>'; }).join('') + '</span>';
  }
  function w(name) { return function (k) { return W[name][k]; }; }
  // SVG: one <text> per domain inside <g class="mx">.
  function smx(fn, attrs) {
    return '<g class="mx">' + KEYS.map(function (k) { return '<text data-m="' + k + '" ' + attrs + '>' + fn(k) + '</text>'; }).join('') + '</g>';
  }
  function t(x, y, s, cls, extra) {
    return '<text x="' + x + '" y="' + y + '" class="' + (cls || 't-mid') + '" ' + (extra || '') + '>' + s + '</text>';
  }
  // 3 decimals, trailing zeros trimmed to at least 2: 0.80, 0.467, 0.15.
  function f3(x) {
    if (x === null || !isFinite(x)) return '&mdash;';
    var s = x.toFixed(3);
    return s.replace(/0$/, '').replace(/^-0\.00$/, '0.00');
  }
  function f2(x) { return x === null || !isFinite(x) ? 'undefined' : x.toFixed(2).replace(/^-0\.00$/, '0.00'); }
  function cnt(x) { var r = Math.round(x * 10) / 10; return (r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)); }
  function pct(x) { return x === null ? '&mdash;' : (Math.round(x * 1000) / 10) + '%'; }
  function slider(id, label, min, max, step, val) {
    return '<div class="lab-sl"><label for="' + id + '">' + label + '</label>' +
      '<input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' +
      '<output for="' + id + '" id="' + id + '-o"></output></div>';
  }
  function stat(k, id, note) {
    return '<div class="s"><div class="k">' + k + '</div><div class="v" id="' + id + '"></div>' + (note ? '<div class="n" id="' + id + '-n"></div>' : '') + '</div>';
  }
  function presets(list) {
    return '<div class="lab-pre" role="group" aria-label="Presets">' + list.map(function (p) {
      return '<button type="button" data-p="' + p[0] + '">' + p[1] + '</button>';
    }).join('') + '</div>';
  }
  function $(root, id) { return root.querySelector('#' + id); }
  var uidN = 0;
  function uid() { return ++uidN; }
  var makers = {};
  function register(name, fn) { makers[name] = fn; }
  function initAll() {
    document.querySelectorAll('.lab[data-lab]').forEach(function (el) {
      var mk = makers[el.getAttribute('data-lab')];
      if (!mk || el.getAttribute('data-ready')) return;
      try { mk(el); el.setAttribute('data-ready', '1'); }
      catch (e) { el.textContent = 'This widget failed to load.'; if (window.console) console.error(e); }
    });
    // <button class="lab-go" data-lab-go="<name>" data-p="<preset>"> elsewhere on the page:
    // sets a preset (if the widget exposes el.labPreset) and scrolls to the widget.
    document.querySelectorAll('[data-lab-go]').forEach(function (bt) {
      if (bt.getAttribute('data-ready')) return;
      bt.setAttribute('data-ready', '1');
      bt.addEventListener('click', function () {
        var el = document.querySelector('.lab[data-lab="' + bt.getAttribute('data-lab-go') + '"]');
        if (!el) return;
        if (el.labPreset) el.labPreset(bt.getAttribute('data-p'));
        el.scrollIntoView({ block: 'start' });
        var f = el.querySelector('input,button'); if (f) f.focus({ preventScroll: true });
      });
    });
  }
  // Deferred scripts run in document order before DOMContentLoaded, so every
  // widgets/<name>.js has registered by the time this fires.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else setTimeout(initAll, 0);
  window.LLMJWidgets = {
    KEYS: KEYS, W: W, mx: mx, w: w, smx: smx, t: t, f2: f2, f3: f3, cnt: cnt, pct: pct,
    slider: slider, stat: stat, presets: presets, $: $, uid: uid, register: register, init: initAll
  };
})();
