// p09#one-case: an imperfect judge comparing two systems. The measured gap is the true
// gap times J, same sign; Rogan-Gladen undoes it. Maths in lab/attenuation.js.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L || !L.measured) return;
  var t = H.t, f3 = H.f3, slider = H.slider, stat = H.stat, presets = H.presets, $ = H.$;
  // [sens, spec, true A, true B, items per system], percentages
  var P = { casebook: [80, 85, 60, 50, 500], small: [80, 85, 60, 50, 100], close: [80, 85, 55, 50, 500], weak: [65, 60, 60, 50, 500] };
  function attWidget(el) {
    var p = 'at' + H.uid();
    el.innerHTML =
      presets([['casebook', 'Casebook, 500 each'], ['small', '100 each'], ['close', '5-point gap'], ['weak', 'Weak judge']]) +
      '<div class="lab-ctl">' + slider(p + '-se', 'Judge sensitivity', 50, 100, 1, 80) + slider(p + '-sp', 'Judge specificity', 50, 100, 1, 85) +
      slider(p + '-a', 'System A true pass rate', 0, 100, 1, 60) + slider(p + '-b', 'System B true pass rate', 0, 100, 1, 50) +
      slider(p + '-n', 'Items graded per system', 50, 2000, 10, 500) + '</div>' +
      '<svg class="dg lab-dist" viewBox="0 0 360 150" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('true gap', p + '-tg') + stat('measured gap', p + '-mg', true) +
      stat('standard errors', p + '-z', true) + stat('Rogan&ndash;Gladen A, B', p + '-rg') + '</div>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var ins = ['se', 'sp', 'a', 'b', 'n'].map(function (k) { return $(el, p + '-' + k); }), svg = el.querySelector('svg');
    function pts(x) { return (Math.round(x * 1000) / 10) + ' pts'; }
    function draw() {
      var v = ins.map(function (i) { return +i.value; });
      var sens = v[0] / 100, spec = v[1] / 100, tA = v[2] / 100, tB = v[3] / 100, n = v[4];
      ins.forEach(function (i, k) {
        $(el, i.id + '-o').textContent = k < 2 ? f3(v[k] / 100) : k < 4 ? v[k] + '%' : v[k];
        i.setAttribute('aria-valuetext', k < 4 ? v[k] + ' percent' : v[k] + ' items');
      });
      var mA = L.measured(tA, sens, spec), mB = L.measured(tB, sens, spec), g = L.gapZ(mA, mB, n, n);
      var j = sens + spec - 1;
      $(el, p + '-tg').innerHTML = pts(tA - tB);
      $(el, p + '-mg').innerHTML = pts(g.gap);
      $(el, p + '-mg-n').innerHTML = '= true gap &times; J (' + f3(j) + ')';
      var z = $(el, p + '-z');
      z.innerHTML = g.z === null ? '&mdash;' : g.z.toFixed(1);
      z.className = 'v ' + (g.z === null ? '' : Math.abs(g.z) >= 2 ? 'lab-good' : 'lab-bad');
      $(el, p + '-z-n').innerHTML = g.z === null ? '' : Math.abs(g.z) >= 2 ? 'gap stands out from the noise' : 'could be luck: label more';
      var rA = L.roganGladen(mA, sens, spec), rB = L.roganGladen(mB, sens, spec);
      $(el, p + '-rg').innerHTML = rA === null ? '&mdash;' : f3(rA) + ', ' + f3(rB);
      $(el, p + '-sum').textContent = 'The judge reports A at ' + pts(mA).replace(' pts', '%') + ' and B at ' + pts(mB).replace(' pts', '%') + ': a true gap of ' + pts(tA - tB) +
        ' shows up as ' + pts(g.gap) + ', ' + (g.z === null ? '' : g.z.toFixed(1) + ' standard errors') + '.';
      var X = function (f) { return 110 + 230 * f; }, s = '';
      [0, 0.5, 1].forEach(function (f) { s += '<line x1="' + X(f) + '" y1="10" x2="' + X(f) + '" y2="128" class="grid"/>' + t(X(f), 142, Math.round(f * 100) + '%', 't-dim', 'font-size="10" text-anchor="middle"'); });
      function row(y, label, val, cls, tc) {
        s += t(104, y + 13, label, 't-ink', 'font-size="11" text-anchor="end"');
        s += '<rect x="' + X(0) + '" y="' + y + '" width="' + (X(val) - X(0)) + '" height="18" class="' + cls + '"/>';
        s += t(X(val) + 4, y + 13, (Math.round(val * 1000) / 10) + '%', tc, 'font-size="10.5"' + (val > 0.85 ? ' text-anchor="end" dx="-8"' : ''));
      }
      row(12, 'A true', tA, 'box-def', 't-def'); row(36, 'A judged', mA, 'box-off', 't-off');
      row(72, 'B true', tB, 'box-def', 't-def'); row(96, 'B judged', mB, 'box-off', 't-off');
      svg.innerHTML = s;
    }
    function set(v) { ins.forEach(function (i, k) { i.value = v[k]; }); draw(); }
    ins.forEach(function (i) { i.addEventListener('input', draw); });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) { bt.addEventListener('click', function () { set(P[bt.getAttribute('data-p')]); }); });
    el.labPreset = function (name) { if (P[name]) set(P[name]); };
    set(P.casebook);
  }
  H.register('attenuation', attWidget);
})();
