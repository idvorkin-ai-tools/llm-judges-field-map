// Term boxes. At a term's first use on a page:
//   <span class="term" data-term="kappa">Cohen's kappa</span>
// This script loads glossary/kappa.json (one file per term, shared by every page)
// and builds a box with three registers: plain (default), ELI5 and technical,
// chosen by the Plain / Technical / ELI5 control in the top bar (site.js sets
// html[data-tech] or html[data-eli5]; CSS in paper.css does the swap live).
// Wide screens: boxes sit in a right-hand margin rail beside their term.
// Narrow screens: the term gets a small "?" chip that opens the box inline.
// See docs/INTERACTIVE.md.
(function () {
  var me = document.currentScript;
  var base = new URL('glossary/', me ? me.src : location.href).href;
  var KEYS = ['hire', 'review', 'wine', 'med', 'ump'];
  var RAIL_MIN = 170; // px of right margin needed before boxes move into the rail
  var items = [];
  var rail = null;

  function mx(obj) {
    return '<span class="mx">' + KEYS.map(function (k) { return '<span data-m="' + k + '">' + (obj[k] || '') + '</span>'; }).join('') + '</span>';
  }
  function boxHTML(d) {
    var h = '<span class="gl-t">' + d.term + '</span>';
    h += '<span class="gl-plain">' + d.plain + '</span>';
    if (d.m) h += '<span class="gl-ex gl-plain">' + mx(d.m) + '</span>';
    h += '<span class="gl-eli5"><span class="gl-reg">ELI5</span>' + d.eli5 + '</span>';
    h += '<span class="gl-tech"><span class="gl-reg">Technical</span>' + d.technical +
      (d.formula ? '<span class="gl-f">' + d.formula + '</span>' : '') + '</span>';
    return h;
  }

  function build(el, d, n) {
    var id = 'gl-' + el.getAttribute('data-term') + '-' + n;
    var box = document.createElement('span');
    box.className = 'gl-box';
    box.id = id;
    box.setAttribute('role', 'note');
    box.innerHTML = boxHTML(d);
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'gl-chip';
    chip.setAttribute('aria-expanded', 'false');
    chip.setAttribute('aria-controls', id);
    chip.setAttribute('aria-label', 'What ' + el.textContent.trim() + ' means');
    chip.textContent = '?';
    chip.addEventListener('click', function () {
      var open = chip.getAttribute('aria-expanded') !== 'true';
      chip.setAttribute('aria-expanded', open ? 'true' : 'false');
      box.classList.toggle('gl-open', open);
    });
    el.classList.add('gl-ready');
    el.insertAdjacentElement('afterend', chip);
    chip.insertAdjacentElement('afterend', box);
    items.push({ term: el, chip: chip, box: box });
  }

  function layout() {
    var main = document.querySelector('main');
    if (!main || !items.length) return;
    var mr = main.getBoundingClientRect();
    var room = document.documentElement.clientWidth - mr.right;
    var wide = room >= RAIL_MIN + 16;
    document.documentElement.classList.toggle('gl-rail-on', wide);
    if (!wide) {
      items.forEach(function (it) {
        if (it.box.parentNode !== it.chip.parentNode) it.chip.insertAdjacentElement('afterend', it.box);
      });
      if (rail) rail.style.display = 'none';
      return;
    }
    if (!rail) {
      rail = document.createElement('div');
      rail.className = 'gl-rail';
      rail.setAttribute('aria-hidden', 'false');
      document.body.appendChild(rail);
    }
    rail.style.display = '';
    var width = Math.min(250, room - 28);
    rail.style.left = (mr.right + window.scrollX + 4) + 'px';
    rail.style.width = width + 'px';
    var railTop = mr.top + window.scrollY;
    rail.style.top = railTop + 'px';
    var bottom = 0;
    items.forEach(function (it) {
      if (it.box.parentNode !== rail) rail.appendChild(it.box);
    });
    items.forEach(function (it) {
      var want = it.term.getBoundingClientRect().top + window.scrollY - railTop - 4;
      var top = Math.max(want, bottom);
      it.box.style.top = top + 'px';
      bottom = top + it.box.offsetHeight + 10;
    });
  }

  var queued = false;
  function relayout() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; layout(); });
  }

  // Visible confirmation when the reader picks a mode on this page: a short toast,
  // plus a flash on the boxes in view (or, on phones where boxes start closed,
  // open the nearest one). Changes synced from another tab only swap the text.
  var toast = null, toastTimer = 0;
  var MODE_NAME = { plain: ['Plain', 'everyday words'], tech: ['Technical', 'precise definitions and formulas'], eli5: ['ELI5', 'explained as if to a five-year-old'] };
  function feedback(m) {
    var root = document.documentElement;
    var mode = MODE_NAME[m] || MODE_NAME.plain;
    var vh = window.innerHeight, seen = [];
    items.forEach(function (it) {
      var el = root.classList.contains('gl-rail-on') ? it.box : it.term, r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) seen.push(it);
    });
    if (!root.classList.contains('gl-rail-on') && seen.length && !seen.some(function (it) { return it.box.classList.contains('gl-open'); })) {
      seen[0].chip.click();
    }
    seen.forEach(function (it) {
      it.box.classList.remove('gl-flash'); void it.box.offsetWidth; it.box.classList.add('gl-flash');
    });
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'gl-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    // No box on screen (say, at the top of a phone page): show the nearest
    // term's text in the new mode inside the toast, so the change is visible.
    var sample = '';
    if (!seen.length && items.length) {
      var near = items.slice().sort(function (x, y) { return dist(x) - dist(y); })[0];
      var reg = near.box.querySelector(m === 'tech' ? '.gl-tech' : m === 'eli5' ? '.gl-eli5' : '.gl-plain');
      var clone = reg.cloneNode(true), lab = clone.querySelector('.gl-reg');
      if (lab) lab.remove();
      sample = near.box.querySelector('.gl-t').textContent + ': ' + clone.textContent.trim();
      if (sample.length > 170) sample = sample.slice(0, 167).replace(/\s+\S*$/, '') + '\u2026';
    }
    toast.innerHTML = '';
    var head = document.createElement('b');
    head.textContent = mode[0] + ' mode';
    toast.appendChild(head);
    toast.appendChild(document.createTextNode(': term boxes now use ' + mode[1] + '.'));
    if (sample) {
      var ex = document.createElement('span');
      ex.className = 'gl-toast-ex';
      ex.textContent = sample;
      toast.appendChild(ex);
    }
    toast.classList.add('gl-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('gl-show'); }, sample ? 4500 : 2600);
  }
  function dist(it) {
    var r = it.term.getBoundingClientRect();
    return r.top > window.innerHeight ? r.top - window.innerHeight : r.bottom < 0 ? -r.bottom : 0;
  }

  function start() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.term[data-term]'));
    if (!els.length) return;
    var ids = {};
    els.forEach(function (el) { ids[el.getAttribute('data-term')] = 1; });
    var cache = {};
    Promise.all(Object.keys(ids).map(function (id) {
      return fetch(base + encodeURIComponent(id) + '.json')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) { cache[id] = d; })
        .catch(function () { if (window.console) console.warn('glossary: no entry for ' + id); });
    })).then(function () {
      els.forEach(function (el, n) { var d = cache[el.getAttribute('data-term')]; if (d) build(el, d, n); });
      layout();
      window.addEventListener('resize', relayout);
      document.addEventListener('llmj:prefs', function (e) {
        relayout();
        if (e.detail && e.detail.source === 'user') feedback(e.detail.mode);
      });
      if (window.ResizeObserver) new ResizeObserver(relayout).observe(document.querySelector('main'));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
      window.addEventListener('load', relayout);
      // the metaphor menu changes text length, so boxes move
      new MutationObserver(relayout).observe(document.documentElement, { attributes: true, attributeFilter: ['data-metaphor', 'data-tech', 'data-eli5'] });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
