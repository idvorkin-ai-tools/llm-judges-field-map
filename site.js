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
  window.LLMJ = { keys: KEYS, names: NAMES, set: set };
})();
