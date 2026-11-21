// p04 error bars: how many items before the kappa interval stops spanning several Landis & Koch words.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L || !L.kappaInterval) return;
  var t = H.t, f2 = H.f2, f3 = H.f3, $ = H.$;
  var PAIRS = { casebook: [0.75, 0.51], paradox: [0.92, 0.8872] };
  // slider position 0..100 -> n from 10 to 5000 on a log scale; position 37 is 100 items
  function nAt(v) { return Math.round(10 * Math.pow(500, v / 100)); }
  function posFor(n) { return Math.round(100 * Math.log(n / 10) / Math.log(500)); }
  var BANDS = [[0, 0.2, 'slight'], [0.2, 0.4, 'fair'], [0.4, 0.6, 'moderate'], [0.6, 0.8, 'substantial'], [0.8, 1, 'almost perfect']];
  function word(k) { if (k < 0) return 'worse than chance'; for (var i = 0; i < BANDS.length; i++) if (k <= BANDS[i][1]) return BANDS[i][2]; return 'almost perfect'; }
  H.register('kappaci', function (el) {
    var p = 'lc' + H.uid(), pair = 'casebook';
    el.innerHTML = H.presets([['casebook', 'Casebook pair (75%, kappa 0.49)'], ['paradox', 'Rare YES (92%, kappa 0.29)']]) +
      '<div class="lab-ctl"><div class="lab-sl lab-wide"><label for="' + p + '-n">Items both raters labelled</label>' +
      '<input type="range" id="' + p + '-n" min="0" max="100" step="1" value="' + posFor(100) + '"><output for="' + p + '-n" id="' + p + '-n-o"></output></div></div>' +
      '<svg class="dg lab-ci" viewBox="0 0 360 132" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + H.stat('kappa, 95% interval', p + '-k') + H.stat('percent agreement, Wilson', p + '-w') +
      H.stat('items for &plusmn;0.10 on kappa', p + '-need') + '</div>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var nIn = $(el, p + '-n'), svg = el.querySelector('.lab-ci');
    function draw() {
      var n = nAt(+nIn.value), po = PAIRS[pair][0], pe = PAIRS[pair][1];
      var r = L.kappaInterval(po, pe, n), wl = L.wilson(po, n);
      $(el, p + '-n-o').textContent = n;
      nIn.setAttribute('aria-valuetext', n + ' items');
      $(el, p + '-k').innerHTML = f2(r.kappa) + ' <small>(' + f2(Math.max(-1, r.lo)) + '&ndash;' + f2(Math.min(1, r.hi)) + ')</small>';
      $(el, p + '-w').innerHTML = f2(po) + ' <small>(' + H.f3(wl.lo) + '&ndash;' + H.f3(wl.hi) + ')</small>';
      $(el, p + '-need').innerHTML = Math.round(L.itemsForKappa(po, pe, 0.1)).toLocaleString('en-US');
      var lo = Math.max(-0.2, r.lo), hi = Math.min(1, r.hi); // drawn range
      var broke = r.hi > 1 || r.lo < -1, clo = Math.max(-1, r.lo), chi = Math.min(1, r.hi);
      $(el, p + '-sum').textContent = 'With ' + n + ' items, kappa ' + f2(r.kappa) + ' could plausibly be anywhere from ' + f2(clo) + ' to ' + f2(chi) +
        ': from "' + word(clo) + '" to "' + word(chi) + '".' + (broke ? ' The formula\'s interval runs past the possible range here: with this few items the large-sample approximation breaks down, and the bootstrap in the appendix is the one to trust.' : '');
      var X = function (k) { return 30 + 300 * (k + 0.2) / 1.2; }, s = '';
      s += '<rect x="' + X(-0.2) + '" y="20" width="' + (X(0) - X(-0.2)) + '" height="22" class="box-crit"/>';
      BANDS.forEach(function (b, i) {
        s += '<rect x="' + X(b[0]) + '" y="20" width="' + (X(b[1]) - X(b[0])) + '" height="22" class="' + (i % 2 ? 'box-def' : 'box') + '"/>';
        s += t(X((b[0] + b[1]) / 2), i % 2 ? 55 : 14, b[2], 't-dim', 'font-size="9.5" text-anchor="middle"');
      });
      [-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1].forEach(function (k) { s += t(X(k), 68, k.toFixed(1).replace('-0.0', '0'), 't-dim', 'font-size="9" text-anchor="middle"'); });
      s += '<line x1="' + X(lo) + '" y1="90" x2="' + X(hi) + '" y2="90" class="ln-off" stroke-width="4"/>';
      s += '<line x1="' + X(lo) + '" y1="82" x2="' + X(lo) + '" y2="98" class="ln-off"/><line x1="' + X(hi) + '" y1="82" x2="' + X(hi) + '" y2="98" class="ln-off"/>';
      s += '<circle cx="' + X(r.kappa) + '" cy="90" r="6" fill="var(--off-bright)"/>';
      s += '<line x1="' + X(0.8) + '" y1="18" x2="' + X(0.8) + '" y2="104" class="ln-def" stroke-dasharray="4 4"/>';
      s += t(180, 124, 'kappa ' + f2(r.kappa) + ', 95% interval ' + f2(Math.max(-1, r.lo)) + ' to ' + f2(Math.min(1, r.hi)) + (r.lo < -0.2 ? ' (cut off at left)' : ''), 't-ink', 'font-size="11" text-anchor="middle"');
      svg.innerHTML = s;
    }
    nIn.addEventListener('input', draw);
    el.querySelectorAll('.lab-pre button').forEach(function (bt) {
      bt.addEventListener('click', function () { pair = bt.getAttribute('data-p'); draw(); });
    });
    draw();
  });
})();
