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
  // Explanation register for term boxes (glossary.js): Technical and ELI5 switches,
  // stored per browser, set on <html> as data-tech / data-eli5 = "on" before first paint.
  var PREFS = { tech: 'llm-judges-tech', eli5: 'llm-judges-eli5' };
  function getPref(k) { try { return localStorage.getItem(PREFS[k]) === 'on'; } catch (e) { return false; } }
  function setPref(k, on) {
    if (on) root.setAttribute('data-' + k, 'on'); else root.removeAttribute('data-' + k);
    try { localStorage.setItem(PREFS[k], on ? 'on' : 'off'); } catch (e) {}
    var boxes = document.querySelectorAll('input.pref-' + k);
    for (var i = 0; i < boxes.length; i++) boxes[i].checked = on;
    try { document.dispatchEvent(new CustomEvent('llmj:prefs')); } catch (e) {}
  }
  ['tech', 'eli5'].forEach(function (k) { if (getPref(k)) root.setAttribute('data-' + k, 'on'); });
  window.addEventListener('storage', function (e) {
    if (e.key === PREFS.tech) setPref('tech', e.newValue === 'on');
    if (e.key === PREFS.eli5) setPref('eli5', e.newValue === 'on');
  });
  document.addEventListener('DOMContentLoaded', function () {
    var mp = document.querySelector('.bar .mpick');
    if (!mp) return;
    var wrap = document.createElement('div');
    wrap.className = 'prefs';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'How term boxes explain things');
    [['tech', 'Technical', 'Tech', 'Show precise definitions and formulas in term boxes'],
     ['eli5', 'ELI5', 'ELI5', 'Explain each term as if to a five-year-old']].forEach(function (d) {
      var lab = document.createElement('label');
      lab.className = 'pref';
      lab.title = d[3];
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'pref-' + d[0];
      cb.setAttribute('aria-label', d[1] + ' explanations');
      cb.checked = root.getAttribute('data-' + d[0]) === 'on';
      cb.addEventListener('change', function () { setPref(d[0], cb.checked); });
      var full = document.createElement('span'); full.className = 'pref-full'; full.textContent = d[1];
      var short = document.createElement('span'); short.className = 'pref-short'; short.textContent = d[2];
      lab.appendChild(cb); lab.appendChild(full); lab.appendChild(short);
      wrap.appendChild(lab);
    });
    mp.parentNode.insertBefore(wrap, mp.nextSibling);
  });
  window.LLMJ = { keys: KEYS, names: NAMES, set: set, setPref: setPref };
})();
