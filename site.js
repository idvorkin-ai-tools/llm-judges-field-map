// Site-wide metaphor switch. Loaded synchronously in <head> so the chosen
// domain is set on <html> before first paint (no flash of the default).
// ?m=wine in the URL picks a domain and remembers it.
(function () {
  var KEYS = ['hire', 'review', 'wine', 'med', 'ump'];
  var NAMES = { hire: 'Job interviews', review: 'Performance reviews', wine: 'Wine judging', med: 'Medicine', ump: 'Umpires & referees' };
  var STORE = 'llm-judges-metaphor';
  var root = document.documentElement;
  function valid(m) { return KEYS.indexOf(m) >= 0; }
  function initial() {
    try { var q = new URLSearchParams(location.search).get('m'); if (valid(q)) return q; } catch (e) {}
    try { var s = localStorage.getItem(STORE); if (valid(s)) return s; } catch (e) {}
    return 'hire';
  }
  function set(m) {
    if (!valid(m)) return;
    root.setAttribute('data-metaphor', m);
    try { localStorage.setItem(STORE, m); } catch (e) {}
    var sels = document.querySelectorAll('select.mpick-s');
    for (var i = 0; i < sels.length; i++) sels[i].value = m;
  }
  set(initial());
  window.addEventListener('storage', function (e) { if (e.key === STORE && valid(e.newValue)) set(e.newValue); });
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.bar-in');
    if (bar) {
      var wrap = document.createElement('div');
      wrap.className = 'mpick';
      var lab = document.createElement('label');
      lab.setAttribute('for', 'mpick');
      lab.textContent = 'Metaphor';
      var sel = document.createElement('select');
      sel.id = 'mpick';
      sel.className = 'mpick-s';
      sel.setAttribute('aria-label', 'Running metaphor for every example on the site');
      KEYS.forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = NAMES[k]; sel.appendChild(o); });
      sel.value = root.getAttribute('data-metaphor');
      sel.addEventListener('change', function () { set(sel.value); });
      wrap.appendChild(lab); wrap.appendChild(sel);
      bar.insertBefore(wrap, bar.querySelector('.back'));
    }
    var btns = document.querySelectorAll('[data-set-m]');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', function () { set(this.getAttribute('data-set-m')); });
  });
  // Explanation mode for term boxes (glossary.js): Plain, Technical or ELI5, one
  // at a time. Stored per browser under one key and set on <html> before first
  // paint (data-tech="on" or data-eli5="on"; Plain sets neither).
  // Only a tap here writes storage. Storage events and bfcache restores just
  // apply the stored value: writing back from a storage handler made open tabs
  // re-broadcast stale values to each other, so the mode flipped on its own.
  var MODE = 'llm-judges-mode';
  var MODES = [['plain', 'Plain', 'Everyday words'], ['tech', 'Technical', 'Precise definitions and formulas'], ['eli5', 'ELI5', 'Explained as if to a five-year-old']];
  var SHORT = { plain: 'Plain', tech: 'Tech', eli5: 'ELI5' };
  function validMode(m) { return m === 'plain' || m === 'tech' || m === 'eli5'; }
  function storedMode() {
    try {
      var m = localStorage.getItem(MODE);
      if (validMode(m)) return m;
      // Read-only migration from the old two-checkbox keys; never written again.
      if (localStorage.getItem('llm-judges-tech') === 'on') return 'tech';
      if (localStorage.getItem('llm-judges-eli5') === 'on') return 'eli5';
    } catch (e) {}
    return 'plain';
  }
  function getMode() { return root.getAttribute('data-tech') === 'on' ? 'tech' : root.getAttribute('data-eli5') === 'on' ? 'eli5' : 'plain'; }
  // source: 'user' (a tap on this page) or 'sync' (another tab, or a restore).
  function applyMode(m, source) {
    if (!validMode(m)) return;
    var changed = m !== getMode();
    if (m === 'tech') root.setAttribute('data-tech', 'on'); else root.removeAttribute('data-tech');
    if (m === 'eli5') root.setAttribute('data-eli5', 'on'); else root.removeAttribute('data-eli5');
    var segs = document.querySelectorAll('.modesel button[data-mode]');
    for (var i = 0; i < segs.length; i++) {
      var on = segs[i].getAttribute('data-mode') === m;
      segs[i].setAttribute('aria-checked', on ? 'true' : 'false');
      segs[i].tabIndex = on ? 0 : -1;
    }
    if (source === 'user') {
      try { if (localStorage.getItem(MODE) !== m) localStorage.setItem(MODE, m); } catch (e) {}
    }
    if (changed || source === 'user') {
      try { document.dispatchEvent(new CustomEvent('llmj:prefs', { detail: { mode: m, source: source } })); } catch (e) {}
    }
  }
  applyMode(storedMode(), 'sync');
  window.addEventListener('storage', function (e) { if (e.key === MODE && validMode(e.newValue)) applyMode(e.newValue, 'sync'); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) applyMode(storedMode(), 'sync'); });
  document.addEventListener('DOMContentLoaded', function () {
    var mp = document.querySelector('.bar .mpick');
    // The mode only changes term boxes, so pages without any don't show it.
    if (!mp || !document.querySelector('.term[data-term]')) return;
    var wrap = document.createElement('div');
    wrap.className = 'modesel';
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', 'How term boxes explain things');
    var cur = getMode();
    MODES.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('data-mode', d[0]);
      b.setAttribute('aria-checked', d[0] === cur ? 'true' : 'false');
      b.tabIndex = d[0] === cur ? 0 : -1;
      b.setAttribute('aria-label', d[1] + ' explanations');
      b.title = d[2];
      b.innerHTML = '<span class="ms-full">' + d[1] + '</span><span class="ms-short">' + SHORT[d[0]] + '</span>';
      b.addEventListener('click', function () { applyMode(d[0], 'user'); });
      wrap.appendChild(b);
    });
    // Arrow keys move between the three, like native radios.
    wrap.addEventListener('keydown', function (e) {
      var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!keys[e.key]) return;
      e.preventDefault();
      var bs = wrap.querySelectorAll('button'), at = 0;
      for (var i = 0; i < bs.length; i++) if (bs[i].getAttribute('data-mode') === getMode()) at = i;
      var nb = bs[(at + keys[e.key] + bs.length) % bs.length];
      applyMode(nb.getAttribute('data-mode'), 'user');
      nb.focus();
    });
    mp.parentNode.insertBefore(wrap, mp.nextSibling);
  });
  window.LLMJ = { keys: KEYS, names: NAMES, set: set, setMode: function (m) { applyMode(m, 'user'); }, getMode: getMode };
})();
