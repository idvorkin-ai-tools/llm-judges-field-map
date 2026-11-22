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
// Explanation mode (Plain / Technical / ELI5): the control, storage and term
// boxes live in the hub's shared assets/terms.js. This only applies the stored
// mode before first paint, the same way terms.js reads it; it never writes.
(function () {
  try {
    var m = localStorage.getItem('aitools-mode');
    if (m !== 'plain' && m !== 'tech' && m !== 'eli5') m = localStorage.getItem('llm-judges-mode');
    if (m === 'tech' || m === 'eli5') document.documentElement.setAttribute('data-' + m, 'on');
  } catch (e) {}
})();
// Unit menu: on part pages the "UNIT 07 OF 09" kicker opens a list of every
// unit (this one marked) with this unit's sections under it; tap to jump.
(function () {
  var UNITS = [
    ['p01', '01', 'Nothing here is new'],
    ['p02', '02', 'The policy: what good means'],
    ['p03', '03', 'Three ways to ask'],
    ['p04', '04', 'Do the judges agree?'],
    ['p05', '05', 'Judge versus truth'],
    ['p06', '06', 'How judges go wrong I: what they are shown'],
    ['p07', '07', 'How judges go wrong II: who is judging'],
    ['p08', '08', 'Calibrating and validating a judge'],
    ['p09', '09', 'When not to trust a judge'],
    ['math', 'A', 'Appendix: the maths, worked']
  ];
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  document.addEventListener('DOMContentLoaded', function () {
    var kick = document.querySelector('main .eyebrow .box');
    var here = (location.pathname.match(/([^\/]+)\.html$/) || [])[1];
    if (!kick || !UNITS.some(function (u) { return u[0] === here; })) return;
    var eb = kick.parentNode;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = kick.className + ' toc-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'toc-pop');
    btn.setAttribute('aria-label', kick.textContent.trim() + ': open the list of units and sections');
    btn.innerHTML = kick.innerHTML + '<span class="toc-caret" aria-hidden="true">&#9662;</span>';
    eb.replaceChild(btn, kick);
    var nav = document.createElement('nav');
    nav.id = 'toc-pop';
    nav.className = 'toc-pop';
    nav.setAttribute('aria-label', 'Units and sections');
    nav.hidden = true;
    var h = '<a class="toc-map" href="../index.html">&larr; The map</a><ol class="toc-units">';
    UNITS.forEach(function (u) {
      var cur = u[0] === here;
      h += '<li' + (cur ? ' class="toc-cur"' : '') + '><a class="toc-a" href="' + u[0] + '.html"' + (cur ? ' aria-current="page"' : '') +
        '><span class="toc-n">' + u[1] + '</span><span>' + esc(u[2]) + '</span></a>';
      if (cur) {
        h += '<ol class="toc-secs">';
        document.querySelectorAll('main h2[id]').forEach(function (s) {
          h += '<li><a class="toc-a" href="#' + encodeURIComponent(s.id) + '">' + esc(s.textContent.trim()) + '</a></li>';
        });
        h += '</ol>';
      }
      h += '</li>';
    });
    nav.innerHTML = h + '</ol>';
    eb.insertAdjacentElement('afterend', nav);
    function links() { return Array.prototype.slice.call(nav.querySelectorAll('a')); }
    function open(on, refocus) {
      nav.hidden = !on;
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) {
        var c = nav.querySelector('a[aria-current]') || links()[0];
        try { c.focus({ preventScroll: true }); } catch (e) { c.focus(); }
        c.scrollIntoView({ block: 'nearest' });
      } else if (refocus) btn.focus();
    }
    btn.addEventListener('click', function () { open(nav.hidden); });
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      open(false);
      var id = a.getAttribute('href').charAt(0) === '#' && decodeURIComponent(a.getAttribute('href').slice(1));
      var t = id && document.getElementById(id);
      if (!t) return;
      // Scroll ourselves: WebKit skips the jump when the clicked link is hidden mid-click.
      e.preventDefault();
      try { history.pushState(null, '', '#' + id); } catch (err) {}
      t.scrollIntoView({ block: 'start' });
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      try { t.focus({ preventScroll: true }); } catch (err) {}
    });
    document.addEventListener('keydown', function (e) {
      if (nav.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); open(false, true); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var ls = links(), at = ls.indexOf(document.activeElement);
      e.preventDefault();
      ls[(at + (e.key === 'ArrowDown' ? 1 : -1) + ls.length) % ls.length].focus();
    });
    document.addEventListener('click', function (e) {
      if (!nav.hidden && !nav.contains(e.target) && !btn.contains(e.target)) open(false);
    });
  });
})();
