// p03: six pairwise results among four contenders, fitted with Bradley-Terry on the
// Elo-style scale. Moving one pair's result moves every rating.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L || !L.btFit) return;
  var mx = H.mx, w = H.w, t = H.t, pct = H.pct, slider = H.slider, stat = H.stat, presets = H.presets, $ = H.$;
  var NAMES = ['A', 'B', 'C', 'D'];
  var PAIRS = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  var PER = 10;
  // Wins for the first of each pair, out of 10, in PAIRS order.
  var PRE = { figure: [6, 7, 8, 6, 4, 6], even: [5, 5, 5, 5, 5, 5], cycle: [5, 5, 5, 8, 2, 8], sweep: [6, 7, 0, 6, 0, 0] };

  H.register('bradley-terry', function (el) {
    var p = 'bt' + H.uid();
    el.innerHTML =
      presets([['figure', 'The figure'], ['even', 'All 5–5'], ['cycle', 'B > C > D > B'], ['sweep', 'D never loses']]) +
      '<div class="lab-ctl">' + PAIRS.map(function (pr, k) {
        return slider(p + '-' + k, NAMES[pr[0]] + ' vs ' + NAMES[pr[1]] + ': wins for ' + NAMES[pr[0]] + ' of ' + PER, 0, PER, 1, PRE.figure[k]);
      }).join('') + '</div>' +
      '<svg class="dg lab-bar" viewBox="0 0 360 150" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('top vs bottom: predicted win rate', p + '-tb') + stat('B beats C', p + '-bc') + stat('rating spread', p + '-sp') + '</div>' +
      '<p class="lab-note">Four ' + mx(w('items')) + ', ten verdicts per pair. Ratings: Bradley&ndash;Terry maximum likelihood, 400 points = ten-to-one odds, centred on 1000.</p>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var inp = PAIRS.map(function (_, k) { return $(el, p + '-' + k); }), svg = el.querySelector('svg');

    function wins() {
      var m = NAMES.map(function () { return [0, 0, 0, 0]; });
      PAIRS.forEach(function (pr, k) { var a = +inp[k].value; m[pr[0]][pr[1]] = a; m[pr[1]][pr[0]] = PER - a; });
      return m;
    }
    function draw() {
      var m = wins(), r = L.btFit(m), tot = m.map(function (row) { return row.reduce(function (z, x) { return z + x; }, 0); });
      PAIRS.forEach(function (pr, k) {
        var a = +inp[k].value;
        $(el, p + '-' + k + '-o').textContent = a + '–' + (PER - a);
        inp[k].setAttribute('aria-valuetext', NAMES[pr[0]] + ' wins ' + a + ', ' + NAMES[pr[1]] + ' wins ' + (PER - a));
      });
      var order = [0, 1, 2, 3].sort(function (i, j) { return r ? r[j] - r[i] : tot[j] - tot[i]; });
      var s = t(10, 12, 'rank', 't-dim', 'font-size="10" text-anchor="start"') + t(76, 12, 'wins of 30', 't-dim', 'font-size="10" text-anchor="middle"') +
        t(240, 12, 'fitted rating', 't-dim', 'font-size="10" text-anchor="middle"');
      var lo = r ? Math.min.apply(null, r) : 0, hi = r ? Math.max.apply(null, r) : 1, span = Math.max(hi - lo, 1);
      order.forEach(function (i, n) {
        var y = 20 + n * 30;
        s += '<rect x="4" y="' + y + '" width="352" height="24" rx="5" class="' + (n === 0 ? 'box-def' : 'box') + '"/>';
        s += t(16, y + 16, String(n + 1), 't-mid', 'font-size="11" text-anchor="middle"');
        s += t(38, y + 16, NAMES[i], 't-ink', 'font-size="12" text-anchor="middle" font-weight="600"');
        s += t(76, y + 16, String(tot[i]), 't-ink', 'font-size="11" text-anchor="middle"');
        if (r) {
          var wd = 20 + 160 * (r[i] - lo) / span;
          s += '<rect x="110" y="' + (y + 6) + '" width="' + wd.toFixed(1) + '" height="12" class="lab-dot"/>';
          s += t(116 + wd, y + 16, String(Math.round(r[i])), 't-ink', 'font-size="11" text-anchor="start"');
        } else if (n === 0) {
          s += t(110, y + 16, 'no finite fit', 't-crit', 'font-size="11" text-anchor="start"');
        }
      });
      svg.innerHTML = s;
      if (r) {
        var top = order[0], bot = order[3];
        $(el, p + '-tb').innerHTML = NAMES[top] + ' over ' + NAMES[bot] + ': ' + pct(L.btWinProb(r[top], r[bot]));
        $(el, p + '-bc').innerHTML = pct(L.btWinProb(r[1], r[2]));
        $(el, p + '-sp').innerHTML = Math.round(hi - lo) + ' points';
        $(el, p + '-sum').textContent = 'Ratings: ' + order.map(function (i) { return NAMES[i] + ' ' + Math.round(r[i]); }).join(', ') +
          '. The model predicts ' + NAMES[top] + ' beats ' + NAMES[bot] + ' ' + pct(L.btWinProb(r[top], r[bot])) + ' of the time.';
      } else {
        ['-tb', '-bc', '-sp'].forEach(function (k) { $(el, p + k).innerHTML = '&mdash;'; });
        $(el, p + '-sum').textContent = 'No finite ratings: some group of contenders never lost to (or never beat) the rest, so the most likely strengths run off to infinity.';
      }
    }
    function set(v) { inp.forEach(function (i, k) { i.value = v[k]; }); draw(); }
    inp.forEach(function (i) { i.addEventListener('input', draw); });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) { bt.addEventListener('click', function () { set(PRE[bt.getAttribute('data-p')]); }); });
    el.labPreset = function (k) { if (PRE[k]) set(PRE[k]); };
    set(PRE.figure);
  });
})();
