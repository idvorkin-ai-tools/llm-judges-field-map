// p07#goodhart: the judge's score keeps climbing while the true score peaks and falls.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L) return;
  var t = H.t, f2 = H.f2, slider = H.slider, stat = H.stat, $ = H.$;
  var ALPHA = 1, DMAX = 10;
  H.register('goodhart', function (el) {
    var p = 'gh' + H.uid();
    el.innerHTML =
      '<div class="lab-ctl">' + slider(p + '-d', 'Optimisation pressure against the judge', 0, DMAX, 0.1, 3) +
      slider(p + '-b', 'Judge’s blind spot: how fast its errors pay off', 0.02, 0.3, 0.01, 0.1) + '</div>' +
      '<svg class="dg lab-bar" viewBox="0 0 360 180" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('judge score', p + '-px') + stat('true score', p + '-g') + stat('true score peaks at', p + '-pk') + '</div>' +
      '<p class="lab-note">Illustrative curves in the shape Gao, Schulman and Hilton (2022) fitted for best-of-n: true score = d(&alpha; &minus; &beta;d), with d the distance pushed from the starting model. The judge’s score is drawn as &alpha;d.</p>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var d = $(el, p + '-d'), b = $(el, p + '-b'), svg = el.querySelector('svg');
    var X0 = 34, X1 = 350, Y0 = 150, Y1 = 14, YMAX = DMAX * ALPHA, YMIN = -4;
    function X(v) { return X0 + (X1 - X0) * v / DMAX; }
    function Y(v) { return Y0 - (Y0 - Y1) * (Math.max(YMIN, Math.min(YMAX, v)) - YMIN) / (YMAX - YMIN); }
    function draw() {
      var dv = +d.value, beta = +b.value, r = L.goodhart(dv, ALPHA, beta), pk = L.goodhartPeak(ALPHA, beta);
      $(el, p + '-d-o').textContent = dv.toFixed(1); $(el, p + '-b-o').textContent = beta.toFixed(2);
      d.setAttribute('aria-valuetext', 'pressure ' + dv.toFixed(1) + ' of ' + DMAX);
      $(el, p + '-px').textContent = f2(r.proxy);
      var g = $(el, p + '-g'); g.textContent = f2(r.gold);
      g.className = 'v ' + (dv > pk.d ? 'lab-bad' : dv > 0.8 * pk.d ? 'lab-mid' : 'lab-good');
      $(el, p + '-pk').textContent = 'pressure ' + pk.d.toFixed(1);
      var s = '<line x1="' + X0 + '" y1="' + Y(0) + '" x2="' + X1 + '" y2="' + Y(0) + '" class="grid"/>' +
        '<line x1="' + X0 + '" y1="' + Y0 + '" x2="' + X0 + '" y2="' + Y1 + '" class="ln"/>' +
        t(X0 - 4, Y(0) + 4, '0', 't-dim', 'font-size="10" text-anchor="end"') +
        t((X0 + X1) / 2, 176, 'optimisation pressure →', 't-dim', 'font-size="10" text-anchor="middle"');
      var pp = [], gp = [];
      for (var i = 0; i <= 100; i++) { var v = DMAX * i / 100, q = L.goodhart(v, ALPHA, beta); pp.push(X(v) + ',' + Y(q.proxy)); gp.push(X(v) + ',' + Y(q.gold)); }
      s += '<polyline points="' + pp.join(' ') + '" class="ln-off" fill="none" stroke-width="2"/>' +
        '<polyline points="' + gp.join(' ') + '" class="lab-ln-ok" stroke-width="2"/>';
      if (pk.d <= DMAX) s += '<line x1="' + X(pk.d) + '" y1="' + Y1 + '" x2="' + X(pk.d) + '" y2="' + Y0 + '" class="ln-def" stroke-dasharray="4 3"/>' +
        t(X(pk.d) + 4, Y0 - 4, 'true peak', 't-def', 'font-size="10"');
      s += '<line x1="' + X(dv) + '" y1="' + Y(r.proxy) + '" x2="' + X(dv) + '" y2="' + Y(r.gold) + '" class="ln-crit" stroke-dasharray="2 2"/>' +
        '<circle cx="' + X(dv) + '" cy="' + Y(r.proxy) + '" r="4.5" class="lab-pt"/><circle cx="' + X(dv) + '" cy="' + Y(r.gold) + '" r="4.5" class="lab-dot"/>' +
        t(X(9.4), Y(9.4 * ALPHA) - 8, 'judge score', 't-off', 'font-size="10.5" text-anchor="end"') +
        t(X1, Math.min(Y0 - 4, Y(L.goodhart(DMAX, ALPHA, beta).gold) + 16), 'true score', 't-ok', 'font-size="10.5" text-anchor="end"');
      svg.innerHTML = s;
      $(el, p + '-sum').textContent = 'At pressure ' + dv.toFixed(1) + ' the judge reports ' + f2(r.proxy) + ' and the true score is ' + f2(r.gold) +
        (dv > pk.d ? ': past the peak at ' + pk.d.toFixed(1) + ', every gain on the judge is a loss in quality.' : ', still rising; it peaks at pressure ' + pk.d.toFixed(1) + '.');
    }
    [d, b].forEach(function (i) { i.addEventListener('input', draw); });
    draw();
  });
})();
