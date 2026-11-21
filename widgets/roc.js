// p05: threshold over two score piles; live confusion matrix, TPR/FPR, Youden's J and the ROC point.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L) return;
  var mx = H.mx, w = H.w, smx = H.smx, t = H.t, f2 = H.f2, f3 = H.f3, cnt = H.cnt, pct = H.pct,
    slider = H.slider, stat = H.stat, presets = H.presets, $ = H.$;
  // ---------- p05: threshold, confusion matrix, ROC ----------
  var NY = 60, NN = 140, SEP0 = 1.878, THR0 = 1.036;
  function rocWidget(el) {
    var p = 'lr' + H.uid();
    el.innerHTML =
      '<div class="lab-pre" role="radiogroup" aria-label="Which scores">' +
      '<label><input type="radio" name="' + p + '-m" value="case" checked> Casebook 1&ndash;5 scores</label>' +
      '<label><input type="radio" name="' + p + '-m" value="smooth"> Smooth scores</label></div>' +
      '<div class="lab-ctl">' + slider(p + '-t', 'Threshold: say ' + mx(w('yes')) + ' if the score is at least', 1, 6, 1, 4) +
      slider(p + '-s', 'Separation between the two piles (smooth scores only)', 0, 4, 0.001, SEP0) + '</div>' +
      '<svg class="dg lab-dist" viewBox="0 0 360 160" aria-hidden="true"></svg>' +
      '<p class="lab-legend"><span class="lg-ok"></span>truly YES (' + NY + ') <span class="lg-crit"></span>truly NO (' + NN + ') <span class="lab-dimtxt">bright = the judge says YES</span></p>' +
      '<div class="lab-row"><div class="lab-cm" id="' + p + '-cm"></div>' +
      '<svg class="dg lab-roc" viewBox="0 0 240 236" role="img" aria-labelledby="' + p + '-sum"></svg></div>' +
      '<div class="statgrid lab-stats">' + stat('sensitivity (TPR)', p + '-tpr') + stat('false positive rate', p + '-fpr') +
      stat('Youden\'s J = TPR &minus; FPR', p + '-j') + stat('precision', p + '-pr') + stat('accuracy', p + '-acc') + stat('AUC (whole curve)', p + '-auc') + '</div>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>' +
      '<p class="lab-note" id="' + p + '-note"></p>';
    var th = $(el, p + '-t'), sp = $(el, p + '-s'), dist = el.querySelector('.lab-dist'), roc = el.querySelector('.lab-roc');
    var mode = 'case', casePts = L.rocPoints(L.CASE_YES, L.CASE_NO), caseAuc = L.aucPairs(L.CASE_YES, L.CASE_NO).auc;
    function setMode(m) {
      mode = m;
      if (m === 'case') { th.min = 1; th.max = 6; th.step = 1; th.value = 4; sp.disabled = true; }
      else { th.min = -2.5; th.max = 5.5; th.step = 0.001; th.value = THR0; sp.disabled = false; sp.value = SEP0; }
      draw();
    }
    function draw() {
      var thr = +th.value, sep = +sp.value, tp, fn, fp, tn, tpr, fpr, curve;
      if (mode === 'case') {
        var c = L.cutCounts(L.CASE_YES, L.CASE_NO, thr);
        tp = c.tp; fn = c.fn; fp = c.fp; tn = c.tn;
        $(el, p + '-t-o').textContent = thr === 6 ? 'never YES' : thr === 1 ? 'always YES' : '≥ ' + thr;
        th.setAttribute('aria-valuetext', thr === 6 ? 'never say YES' : 'YES if score is at least ' + thr);
        $(el, p + '-s-o').textContent = 'fixed';
      } else {
        var b = L.binormal(sep, thr);
        tp = NY * b.tpr; fn = NY - tp; fp = NN * b.fpr; tn = NN - fp;
        $(el, p + '-t-o').textContent = '≥ ' + thr.toFixed(2);
        th.setAttribute('aria-valuetext', 'YES if score is at least ' + thr.toFixed(2));
        $(el, p + '-s-o').textContent = sep.toFixed(2);
        sp.setAttribute('aria-valuetext', 'separation ' + sep.toFixed(2) + ' standard deviations');
      }
      var m = L.confusion(tp, fn, fp, tn);
      tpr = m.tpr; fpr = m.fpr;
      var auc = mode === 'case' ? caseAuc : L.binormalAuc(sep);
      $(el, p + '-tpr').innerHTML = f3(tpr); $(el, p + '-fpr').innerHTML = f3(fpr);
      var jv = $(el, p + '-j'); jv.innerHTML = f3(m.j); jv.className = 'v lab-off';
      $(el, p + '-pr').innerHTML = f3(m.precision); $(el, p + '-acc').innerHTML = f3(m.accuracy);
      $(el, p + '-auc').innerHTML = f3(auc);
      $(el, p + '-note').innerHTML = mode === 'case'
        ? 'Casebook: the 200 gold items scored 1&ndash;5 by the judge, as in the table above. Only five cuts exist, so the point jumps between corners.'
        : 'Smooth: an invented judge whose scores for truly-NO items follow a bell curve and truly-YES items the same curve shifted right by the separation. At separation 1.88 and threshold 1.04 it reproduces the casebook cut exactly (48, 12, 21, 119), but its AUC is about 0.91, not the casebook&rsquo;s 0.868, because the five-level scale ties items the smooth judge can tell apart. The faint dots are the casebook cuts.';
      $(el, p + '-sum').textContent = 'TP ' + cnt(tp) + ', FN ' + cnt(fn) + ', FP ' + cnt(fp) + ', TN ' + cnt(tn) +
        '. Sensitivity ' + f3(tpr) + ', false positive rate ' + f3(fpr) + ', Youden\'s J ' + f3(m.j) + '.';
      // confusion matrix
      $(el, p + '-cm').innerHTML = '<table class="lab-cmt"><tr><th></th><th>' + mx(w('judge')) + ' says ' + mx(w('yes')) + '</th><th>says ' + mx(w('no')) + '</th></tr>' +
        '<tr><th>' + mx(w('tYes')) + ' <i>' + NY + '</i></th><td class="ok">' + cnt(tp) + '<small>true positive</small></td><td class="crit">' + cnt(fn) + '<small>missed</small></td></tr>' +
        '<tr><th>' + mx(w('tNo')) + ' <i>' + NN + '</i></th><td class="crit">' + cnt(fp) + '<small>false positive</small></td><td class="ok">' + cnt(tn) + '<small>true negative</small></td></tr></table>';
      // score distributions
      var s = '', base = 140, top = 18;
      if (mode === 'case') {
        var mx1 = 50, bw = 22;
        for (var i = 0; i < 5; i++) {
          var cx = 50 + i * 62, on = i + 1 >= thr;
          var hy = (base - top) * L.CASE_YES[i] / mx1, hn = (base - top) * L.CASE_NO[i] / mx1;
          s += '<rect x="' + (cx - bw - 1) + '" y="' + (base - hy) + '" width="' + bw + '" height="' + hy + '" class="' + (on ? 'lab-ok' : 'lab-ok-dim') + '"/>';
          s += '<rect x="' + (cx + 1) + '" y="' + (base - hn) + '" width="' + bw + '" height="' + hn + '" class="' + (on ? 'lab-crit' : 'lab-crit-dim') + '"/>';
          s += t(cx - bw / 2 - 1, base - hy - 4, L.CASE_YES[i], 't-ok', 'font-size="10" text-anchor="middle"');
          s += t(cx + bw / 2 + 1, base - hn - 4, L.CASE_NO[i], 't-crit', 'font-size="10" text-anchor="middle"');
          s += t(cx, base + 14, i + 1, 't-dim', 'font-size="11" text-anchor="middle"');
        }
        var lx = thr === 6 ? 50 + 4.5 * 62 : 50 + (thr - 1.5) * 62;
        if (thr === 1) lx = 14;
        s += '<line x1="' + lx + '" y1="' + (top - 6) + '" x2="' + lx + '" y2="' + (base + 4) + '" class="ln-def" stroke-dasharray="4 3" stroke-width="2"/>';
      } else {
        var lo = -3, hi = 6, X = function (z) { return 20 + 320 * (z - lo) / (hi - lo); };
        var peak = NN * L.normPdf(0), Y = function (v) { return base - (base - top) * v / peak; };
        var ptsN = [], ptsY = [], fillN = [], fillY = [];
        for (var z = lo; z <= hi + 1e-9; z += 0.05) {
          var vn = NN * L.normPdf(z), vy = NY * L.normPdf(z - sep);
          ptsN.push(X(z).toFixed(1) + ',' + Y(vn).toFixed(1)); ptsY.push(X(z).toFixed(1) + ',' + Y(vy).toFixed(1));
          if (z >= thr) { fillN.push(X(z).toFixed(1) + ',' + Y(vn).toFixed(1)); fillY.push(X(z).toFixed(1) + ',' + Y(vy).toFixed(1)); }
        }
        var tx = Math.max(X(lo), Math.min(X(hi), X(thr)));
        if (fillN.length) {
          var head = tx.toFixed(1) + ',' + base, tail = X(hi).toFixed(1) + ',' + base;
          s += '<polygon points="' + head + ' ' + tx.toFixed(1) + ',' + Y(NN * L.normPdf(thr)).toFixed(1) + ' ' + fillN.join(' ') + ' ' + tail + '" class="lab-crit"/>';
          s += '<polygon points="' + head + ' ' + tx.toFixed(1) + ',' + Y(NY * L.normPdf(thr - sep)).toFixed(1) + ' ' + fillY.join(' ') + ' ' + tail + '" class="lab-ok"/>';
        }
        s += '<polyline points="' + ptsN.join(' ') + '" class="ln-crit" stroke-width="2"/>';
        s += '<polyline points="' + ptsY.join(' ') + '" class="lab-ln-ok" stroke-width="2"/>';
        s += '<line x1="' + tx + '" y1="' + (top - 6) + '" x2="' + tx + '" y2="' + (base + 4) + '" class="ln-def" stroke-dasharray="4 3" stroke-width="2"/>';
        s += t(180, base + 14, 'judge\'s score &rarr;', 't-dim', 'font-size="10.5" text-anchor="middle"');
      }
      s += '<line x1="14" y1="' + base + '" x2="346" y2="' + base + '" class="ln"/>';
      dist.innerHTML = s;
      // ROC square
      var R0 = 34, RS = 190, RX = function (f) { return R0 + RS * f; }, RY = function (f) { return 8 + RS * (1 - f); }, r = '';
      r += '<rect x="' + R0 + '" y="8" width="' + RS + '" height="' + RS + '" class="box"/>';
      r += '<line x1="' + RX(0) + '" y1="' + RY(0) + '" x2="' + RX(1) + '" y2="' + RY(1) + '" class="ln" stroke-dasharray="4 4"/>';
      var cp = casePts.map(function (q) { return RX(q.fpr).toFixed(1) + ',' + RY(q.tpr).toFixed(1); }).join(' ');
      if (mode === 'case') {
        r += '<polygon points="' + RX(0) + ',' + RY(0) + ' ' + cp + ' ' + RX(1) + ',' + RY(0) + '" class="lab-area"/>';
        r += '<polyline points="' + cp + '" class="ln-def" stroke-width="2"/>';
      } else {
        curve = [];
        for (var zz = 8; zz >= -6; zz -= 0.1) { var bb = L.binormal(sep, zz); curve.push(RX(bb.fpr).toFixed(1) + ',' + RY(bb.tpr).toFixed(1)); }
        r += '<polygon points="' + RX(0) + ',' + RY(0) + ' ' + curve.join(' ') + ' ' + RX(1) + ',' + RY(0) + '" class="lab-area"/>';
        r += '<polyline points="' + curve.join(' ') + '" class="ln-def" stroke-width="2"/>';
      }
      casePts.forEach(function (q) { r += '<circle cx="' + RX(q.fpr) + '" cy="' + RY(q.tpr) + '" r="3" class="' + (mode === 'case' ? 'lab-dot' : 'lab-dot-dim') + '"/>'; });
      r += '<line x1="' + RX(fpr) + '" y1="' + RY(fpr) + '" x2="' + RX(fpr) + '" y2="' + RY(tpr) + '" class="ln-off" stroke-width="3"/>';
      r += '<circle cx="' + RX(fpr) + '" cy="' + RY(tpr) + '" r="6" class="lab-pt"/>';
      r += t(RX(fpr) + (fpr > 0.6 ? -8 : 8), (RY(tpr) + RY(fpr)) / 2 + 4, 'J ' + f3(m.j), 't-off', 'font-size="11" font-weight="600" text-anchor="' + (fpr > 0.6 ? 'end' : 'start') + '"');
      r += t(RX(0.5), 228, 'false positive rate &rarr;', 't-dim', 'font-size="10.5" text-anchor="middle"');
      r += t(14, RY(0.5), 'sensitivity &rarr;', 't-dim', 'font-size="10.5" text-anchor="middle" transform="rotate(-90 14 ' + RY(0.5) + ')"');
      r += t(RX(0) - 4, RY(0) + 4, '0', 't-dim', 'font-size="9.5" text-anchor="end"') + t(RX(0) - 4, RY(1) + 8, '1', 't-dim', 'font-size="9.5" text-anchor="end"');
      r += t(RX(1), RY(0) + 12, '1', 't-dim', 'font-size="9.5" text-anchor="middle"');
      roc.innerHTML = r;
    }
    el.querySelectorAll('input[type=radio]').forEach(function (rb) { rb.addEventListener('change', function () { setMode(rb.value); }); });
    th.addEventListener('input', draw); sp.addEventListener('input', draw);
    // Smooth sliders use a fine step so the defaults hit the casebook cut exactly;
    // arrow keys move in readable 0.05 steps instead of 0.001.
    [th, sp].forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        var dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
        if (!dir || +inp.step >= 1) return;
        e.preventDefault();
        inp.value = Math.min(+inp.max, Math.max(+inp.min, +inp.value + dir * 0.05)).toFixed(3);
        draw();
      });
    });
    setMode('case');
  }

  H.register('roc', rocWidget);
})();
