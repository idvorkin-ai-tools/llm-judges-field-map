// p08#error-bars and math.html#ci: how wide the error bar on a proportion is, and how
// many items a narrower one costs. Maths in lab/wilsonci.js.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L || !L.wilson) return;
  var t = H.t, f3 = H.f3, slider = H.slider, stat = H.stat, presets = H.presets, $ = H.$;
  // [items, observed %]; every preset's k = round(n * % / 100) is the page's count.
  var P = { sens: [60, 80], spec: [140, 85], agree: [100, 75], small: [50, 80], big: [500, 80] };
  function ciWidget(el) {
    var p = 'ci' + H.uid();
    el.innerHTML =
      presets([['sens', 'Sensitivity 48/60'], ['spec', 'Specificity 119/140'], ['agree', 'Agreement 75/100'], ['small', '80% of 50'], ['big', '80% of 500']]) +
      '<div class="lab-ctl">' + slider(p + '-n', 'Items of this kind labelled (for a sensitivity: truly-YES items only)', 10, 1000, 1, 60) +
      slider(p + '-r', 'Share the judge got right', 1, 99, 1, 80) +
      slider(p + '-h', 'Error bar you can live with (&plusmn; points)', 1, 20, 1, 5) + '</div>' +
      '<svg class="dg lab-dist" viewBox="0 0 360 132" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('observed', p + '-o') + stat('95% Wilson interval', p + '-w', true) +
      stat('normal approximation', p + '-a', true) + stat('items needed', p + '-need', true) + '</div>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var nI = $(el, p + '-n'), rI = $(el, p + '-r'), hI = $(el, p + '-h'), svg = el.querySelector('svg');
    function draw() {
      var n = +nI.value, k = Math.round(n * rI.value / 100), h = hI.value / 100;
      var w = L.wilson(k, n), a = L.wald(k, n), need = Math.ceil(L.nForHalfWidth(w.p, h));
      $(el, p + '-n-o').textContent = n; $(el, p + '-r-o').textContent = rI.value + '%'; $(el, p + '-h-o').textContent = '±' + hI.value;
      nI.setAttribute('aria-valuetext', n + ' items'); rI.setAttribute('aria-valuetext', rI.value + ' percent right');
      hI.setAttribute('aria-valuetext', 'plus or minus ' + hI.value + ' points');
      $(el, p + '-o').innerHTML = k + '/' + n + ' = ' + f3(w.p);
      $(el, p + '-w').innerHTML = f3(w.lo) + '&ndash;' + f3(w.hi);
      $(el, p + '-w-n').innerHTML = '&plusmn;' + f3(w.half) + ', centre ' + f3(w.centre);
      // unclamped on purpose: Wald running below 0 or past 1 is the point
      $(el, p + '-a').innerHTML = f3(a.lo) + '&ndash;' + f3(a.hi);
      $(el, p + '-a-n').innerHTML = '&plusmn;' + f3(a.half) + ' = 1.96&radic;(p(1&minus;p)/n)';
      // at 0 or n right the normal approximation claims zero width, so it cannot size a sample
      var edge = k === 0 || k === n;
      $(el, p + '-need').innerHTML = edge ? '&mdash;' : need.toLocaleString('en-US');
      $(el, p + '-need-n').innerHTML = edge ? 'the approximation breaks at 0% or 100%' :
        'for &plusmn;' + hI.value + ' points at ' + f3(w.p) + (need > n ? ' (' + (need / n).toFixed(1) + '&times; what you have)' : ' (you have enough)');
      $(el, p + '-sum').textContent = k + ' right out of ' + n + ': the true rate is probably between ' + f3(w.lo) + ' and ' + f3(w.hi) +
        (edge ? '. The normal approximation cannot size a sample at 0% or 100%.' : '. To get the error bar down to plus or minus ' + hI.value + ' points you need about ' + need + ' items.');
      var X = function (v) { return 20 + 320 * v; }, s = '';
      for (var g = 0; g <= 10; g += 2) {
        s += '<line x1="' + X(g / 10) + '" y1="14" x2="' + X(g / 10) + '" y2="104" class="grid"/>' + t(X(g / 10), 120, (g / 10).toFixed(1), 't-dim', 'font-size="10" text-anchor="middle"');
      }
      function bar(y, lo, hi, mid, cls, label) {
        lo = Math.max(0, lo); hi = Math.min(1, hi);
        s += t(20, y - 9, label, 't-ink', 'font-size="10.5"');
        s += '<line x1="' + X(lo) + '" y1="' + y + '" x2="' + X(hi) + '" y2="' + y + '" class="' + cls + '" stroke-width="3"/>';
        s += '<line x1="' + X(lo) + '" y1="' + (y - 6) + '" x2="' + X(lo) + '" y2="' + (y + 6) + '" class="' + cls + '"/>';
        s += '<line x1="' + X(hi) + '" y1="' + (y - 6) + '" x2="' + X(hi) + '" y2="' + (y + 6) + '" class="' + cls + '"/>';
        s += '<circle cx="' + X(mid) + '" cy="' + y + '" r="4.5" class="lab-pt"/>';
      }
      bar(40, w.lo, w.hi, w.p, 'ln-def', 'Wilson (the site\'s tiles and figures)');
      bar(88, a.lo, a.hi, a.p, 'ln-off', 'normal approximation' + (a.lo < 0 || a.hi > 1 ? ': runs off the scale' : ' (&plusmn; rules of thumb)'));
      svg.innerHTML = s;
    }
    function set(v) { nI.value = v[0]; rI.value = v[1]; draw(); }
    [nI, rI, hI].forEach(function (i) { i.addEventListener('input', draw); });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) { bt.addEventListener('click', function () { set(P[bt.getAttribute('data-p')]); }); });
    el.labPreset = function (name) { if (P[name]) set(P[name]); };
    set(P.sens);
  }
  H.register('wilsonci', ciWidget);
})();
