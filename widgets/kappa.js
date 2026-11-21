// p04: two raters on a 2x2 grid; percent agreement, chance agreement, kappa, and the prevalence paradox.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L) return;
  var mx = H.mx, w = H.w, smx = H.smx, t = H.t, f2 = H.f2, f3 = H.f3, cnt = H.cnt, pct = H.pct,
    slider = H.slider, stat = H.stat, presets = H.presets, $ = H.$;
  // ---------- p04: two raters, kappa and the paradox ----------
  var KP = {
    casebook: [45, 15, 10, 30], paradox: [2, 4, 4, 90], perfect: [50, 0, 0, 50],
    chance: [25, 25, 25, 25], lopsided: [45, 25, 0, 30], worse: [10, 40, 40, 10]
  };
  function kappaWidget(el) {
    var p = 'lk' + H.uid();
    var cellLab = [
      'both ' + mx(w('yes')),
      mx(w('A')) + ' ' + mx(w('yes')) + ', ' + mx(w('B')) + ' ' + mx(w('no')),
      mx(w('A')) + ' ' + mx(w('no')) + ', ' + mx(w('B')) + ' ' + mx(w('yes')),
      'both ' + mx(w('no'))
    ];
    el.innerHTML =
      presets([['casebook', 'Casebook 75%'], ['paradox', 'Kappa paradox'], ['perfect', 'Perfect'], ['chance', 'Coin flips'], ['lopsided', 'One-sided disagreement'], ['worse', 'Worse than chance']]) +
      '<div class="lab-row"><svg class="dg lab-grid" viewBox="0 0 340 236" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('percent agreement p<sub>o</sub>', p + '-po') + stat('chance agreement p<sub>e</sub>', p + '-pe') +
      stat('Cohen\'s kappa', p + '-k', true) + stat('agree on YES / on NO', p + '-pp') + '</div></div>' +
      '<svg class="dg lab-bar" viewBox="0 0 340 112" aria-hidden="true"></svg>' +
      '<div class="eq lab-eq" id="' + p + '-eq"></div>' +
      '<div class="lab-ctl">' +
      slider(p + '-a', cellLab[0], 0, 100, 1, 45) + slider(p + '-b', cellLab[1], 0, 100, 1, 15) +
      slider(p + '-c', cellLab[2], 0, 100, 1, 10) + slider(p + '-d', cellLab[3], 0, 100, 1, 30) +
      '<div class="lab-sl lab-wide">' + '<label for="' + p + '-q">Prevalence: of the items they agree on, the share both call ' + mx(w('yes')) + ' (agreement count held fixed)</label>' +
      '<input type="range" id="' + p + '-q" min="0" max="100" step="1" value="60"><output for="' + p + '-q" id="' + p + '-q-o"></output></div>' +
      '</div><p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var ids = ['a', 'b', 'c', 'd'];
    var inp = ids.map(function (k) { return $(el, p + '-' + k); });
    var q = $(el, p + '-q');
    var grid = el.querySelector('.lab-grid'), bar = el.querySelector('.lab-bar');
    function cells() { return inp.map(function (i) { return +i.value; }); }
    function setCells(v, keepQ) {
      inp.forEach(function (i, n) { i.value = v[n]; });
      if (!keepQ) { var agr = v[0] + v[3]; q.value = agr ? Math.round(100 * v[0] / agr) : 50; }
      draw();
    }
    function draw() {
      var v = cells(), a = v[0], b = v[1], c = v[2], d = v[3];
      var r = L.agreement(a, b, c, d), n = r.n;
      inp.forEach(function (i, k) { var o = $(el, i.id + '-o'); o.textContent = v[k]; i.setAttribute('aria-valuetext', v[k] + ' items'); });
      $(el, p + '-q-o').textContent = q.value + '%';
      q.setAttribute('aria-valuetext', q.value + ' percent of agreements are both YES');
      $(el, p + '-po').innerHTML = pct(r.po);
      $(el, p + '-pe').innerHTML = pct(r.pe);
      var kv = $(el, p + '-k');
      kv.innerHTML = f2(r.kappa);
      kv.className = 'v ' + (r.kappa === null ? '' : r.kappa < 0.2 ? 'lab-bad' : r.kappa > 0.6 ? 'lab-good' : 'lab-mid');
      $(el, p + '-k-n').textContent = L.landisKoch(r.kappa) + (r.kappa === null ? '' : ' (Landis & Koch)');
      $(el, p + '-pp').innerHTML = f3(r.ppos) + ' / ' + f3(r.pneg);
      $(el, p + '-eq').innerHTML = r.kappa === null
        ? '&kappa; = (p<sub>o</sub> &minus; p<sub>e</sub>) / (1 &minus; p<sub>e</sub>) = 0 / 0: ' + (n ? 'both raters gave every item the same answer, so chance already explains everything' : 'no items')
        : '&kappa; = (p<sub>o</sub> &minus; p<sub>e</sub>) / (1 &minus; p<sub>e</sub>) = (' + f3(r.po) + ' &minus; ' + f3(r.pe) + ') / (1 &minus; ' + f3(r.pe) + ') = ' + f2(r.kappa);
      $(el, p + '-sum').textContent = 'On ' + n + ' items the raters agree on ' + (a + d) + ': percent agreement ' + pct(r.po).replace('&mdash;', 'undefined') +
        ', chance agreement ' + pct(r.pe).replace('&mdash;', 'undefined') + ', kappa ' + f2(r.kappa) + '.';
      // the 2x2 grid
      var x0 = 120, y0 = 46, cw = 92, ch = 64, s = '';
      s += smx(w('B'), 'x="' + (x0 + cw) + '" y="14" class="t-def" font-size="12" text-anchor="middle" font-weight="600"');
      s += smx(w('yes'), 'x="' + (x0 + cw / 2) + '" y="36" class="t-mid" font-size="11.5" text-anchor="middle"');
      s += smx(w('no'), 'x="' + (x0 + 1.5 * cw) + '" y="36" class="t-mid" font-size="11.5" text-anchor="middle"');
      s += smx(w('A'), 'x="4" y="' + (y0 + ch) + '" class="t-def" font-size="12" font-weight="600"');
      s += smx(w('yes'), 'x="' + (x0 - 8) + '" y="' + (y0 + ch / 2 + 4) + '" class="t-mid" font-size="11.5" text-anchor="end"');
      s += smx(w('no'), 'x="' + (x0 - 8) + '" y="' + (y0 + 1.5 * ch + 4) + '" class="t-mid" font-size="11.5" text-anchor="end"');
      var mxv = Math.max(1, a, b, c, d);
      [[a, 0, 0, 1], [b, 1, 0, 0], [c, 0, 1, 0], [d, 1, 1, 1]].forEach(function (z) {
        var x = x0 + z[1] * cw, y = y0 + z[2] * ch, ok = z[3];
        s += '<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + ch + '" class="' + (ok ? 'box-ok' : 'box-crit') + '"/>';
        var h = Math.round((ch - 4) * z[0] / mxv);
        s += '<rect x="' + (x + 2) + '" y="' + (y + ch - 2 - h) + '" width="' + (cw - 4) + '" height="' + h + '" class="' + (ok ? 'lab-fill-ok' : 'lab-fill-crit') + '"/>';
        s += t(x + cw / 2, y + ch / 2 + 8, z[0], ok ? 't-ok' : 't-crit', 'font-size="22" text-anchor="middle" font-weight="600"');
      });
      s += t(x0 + 2 * cw + 8, y0 + ch / 2 + 4, (a + b) + ' total', 't-dim', 'font-size="11"');
      s += t(x0 + 2 * cw + 8, y0 + 1.5 * ch + 4, (c + d) + ' total', 't-dim', 'font-size="11"');
      s += t(x0 + cw / 2, y0 + 2 * ch + 18, (a + c) + ' total', 't-dim', 'font-size="11" text-anchor="middle"');
      s += t(x0 + 1.5 * cw, y0 + 2 * ch + 18, (b + d) + ' total', 't-dim', 'font-size="11" text-anchor="middle"');
      s += t(x0 + cw, y0 + 2 * ch + 40, 'agree on ' + a + ' + ' + d + ' = ' + (a + d) + ' of ' + n, 't-ok', 'font-size="11.5" text-anchor="middle" font-weight="600"');
      grid.innerHTML = s;
      // observed vs chance on a 0-100% axis
      var X = function (f) { return 70 + 260 * f; }, g = '';
      g += t(62, 22, 'observed', 't-ink', 'font-size="11" text-anchor="end" font-weight="600"');
      g += t(62, 50, 'chance', 't-ink', 'font-size="11" text-anchor="end" font-weight="600"');
      g += '<rect x="70" y="8" width="260" height="20" class="box"/><rect x="70" y="36" width="260" height="20" class="box"/>';
      if (n) {
        g += '<rect x="70" y="8" width="' + (260 * r.po) + '" height="20" class="box-ok"/>';
        g += '<rect x="70" y="36" width="' + (260 * r.pe) + '" height="20" class="box-def"/>';
        if (r.kappa !== null) {
          var lo = Math.min(r.pe, r.po), hi = Math.max(r.pe, r.po);
          g += '<line x1="' + X(r.pe) + '" y1="66" x2="' + X(1) + '" y2="66" class="ln"/>';
          g += '<line x1="' + X(lo) + '" y1="66" x2="' + X(hi) + '" y2="66" class="' + (r.po >= r.pe ? 'ln-off' : 'ln-crit') + '" stroke-width="4"/>';
          g += '<line x1="' + X(r.pe) + '" y1="60" x2="' + X(r.pe) + '" y2="72" class="ln"/><line x1="' + X(1) + '" y1="60" x2="' + X(1) + '" y2="72" class="ln"/>';
          g += t(200, 88, (r.po >= r.pe ? 'beyond chance ' : 'below chance ') + Math.abs(Math.round((r.po - r.pe) * 1000) / 10) + ' of ' + (Math.round((1 - r.pe) * 1000) / 10) + ' points of room', 't-off', 'font-size="11" text-anchor="middle"');
        }
      }
      [0, 0.25, 0.5, 0.75, 1].forEach(function (f) { g += t(X(f), 106, (f * 100) + '%', 't-dim', 'font-size="10" text-anchor="middle"'); });
      bar.innerHTML = g;
    }
    inp.forEach(function (i) { i.addEventListener('input', function () { setCells(cells()); }); });
    q.addEventListener('input', function () {
      var v = cells(), agr = v[0] + v[3], a = Math.round(agr * q.value / 100);
      setCells([a, v[1], v[2], agr - a], true);
    });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) {
      bt.addEventListener('click', function () { setCells(KP[bt.getAttribute('data-p')]); });
    });
    el.labPreset = function (name) { if (KP[name]) setCells(KP[name]); };
    setCells(KP.casebook);
  }

  H.register('kappa', kappaWidget);
})();
