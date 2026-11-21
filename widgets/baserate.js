// p05: same judge, different prevalence; precision collapses while J stays put.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L) return;
  var mx = H.mx, w = H.w, smx = H.smx, t = H.t, f2 = H.f2, f3 = H.f3, cnt = H.cnt, pct = H.pct,
    slider = H.slider, stat = H.stat, presets = H.presets, $ = H.$;
  // ---------- p05: base rate ----------
  var BP = { casebook: [80, 85, 30], prod: [80, 85, 5], rare: [80, 85, 1], balanced: [80, 85, 50] };
  function baseRateWidget(el) {
    var p = 'lb' + H.uid();
    el.innerHTML =
      presets([['casebook', 'Gold set, 30%'], ['prod', 'Production, 5%'], ['rare', 'Rare failure, 1%'], ['balanced', 'Balanced, 50%']]) +
      '<div class="lab-ctl">' + slider(p + '-se', 'Sensitivity (share of truly-YES items it calls YES)', 0, 100, 1, 80) +
      slider(p + '-sp', 'Specificity (share of truly-NO items it calls NO)', 0, 100, 1, 85) +
      '<div class="lab-sl lab-wide"><label for="' + p + '-pv">Prevalence: share of ' + mx(w('items')) + ' that are truly YES</label>' +
      '<input type="range" id="' + p + '-pv" min="0.5" max="99.5" step="0.5" value="30"><output for="' + p + '-pv" id="' + p + '-pv-o"></output></div></div>' +
      '<svg class="dg lab-br" viewBox="0 0 360 150" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('precision: a YES is right', p + '-pr') + stat('NPV: a NO is right', p + '-npv') +
      stat('accuracy', p + '-acc', true) + stat('Youden\'s J', p + '-j') + '</div>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var se = $(el, p + '-se'), spc = $(el, p + '-sp'), pv = $(el, p + '-pv'), svg = el.querySelector('.lab-br');
    function draw() {
      var sens = se.value / 100, spec = spc.value / 100, prev = pv.value / 100, r = L.baseRate(sens, spec, prev, 1000);
      $(el, p + '-se-o').textContent = f3(sens); $(el, p + '-sp-o').textContent = f3(spec); $(el, p + '-pv-o').textContent = pv.value + '%';
      se.setAttribute('aria-valuetext', se.value + ' percent'); spc.setAttribute('aria-valuetext', spc.value + ' percent'); pv.setAttribute('aria-valuetext', pv.value + ' percent');
      var pr = $(el, p + '-pr'); pr.innerHTML = f3(r.precision);
      pr.className = 'v ' + (r.precision === null ? '' : r.precision < 0.5 ? 'lab-bad' : r.precision > 0.8 ? 'lab-good' : 'lab-mid');
      $(el, p + '-npv').innerHTML = f3(r.npv);
      $(el, p + '-acc').innerHTML = f3(r.accuracy);
      $(el, p + '-acc-n').innerHTML = 'always-NO judge: ' + f3(r.alwaysNo);
      $(el, p + '-j').innerHTML = f3(r.j);
      var said = r.tp + r.fp;
      $(el, p + '-sum').textContent = 'Of 1,000 items, ' + cnt(r.yes) + ' are truly YES. The judge says YES to ' + cnt(said) + ': ' + cnt(r.tp) + ' right and ' + cnt(r.fp) +
        ' wrong, so precision is ' + f3(r.precision).replace('&mdash;', 'undefined') + '.';
      var X0 = 10, WD = 340, s = '';
      function row(y, title, parts) {
        s += t(X0, y - 6, title, 't-ink', 'font-size="11" font-weight="600"');
        var tot = parts.reduce(function (z, q) { return z + q[0]; }, 0), x = X0;
        if (!(tot > 0)) { s += '<rect x="' + X0 + '" y="' + y + '" width="' + WD + '" height="26" class="box"/>' + t(X0 + WD / 2, y + 17, 'empty', 't-dim', 'font-size="11" text-anchor="middle"'); return; }
        parts.forEach(function (q) {
          var wdt = WD * q[0] / tot;
          s += '<rect x="' + x + '" y="' + y + '" width="' + wdt + '" height="26" class="' + q[1] + '"/>';
          x += wdt;
        });
        x = X0;
        parts.forEach(function (q, k) {
          var wdt = WD * q[0] / tot;
          if (wdt > 70) s += t(x + wdt / 2, y + 17, q[2], k ? 't-crit' : 't-ok', 'font-size="10.5" text-anchor="middle"');
          x += wdt;
        });
        s += t(X0 + WD, y + 42, parts.map(function (q) { return q[3]; }).join(' · '), 't-dim', 'font-size="10.5" text-anchor="end"');
      }
      row(22, 'All 1,000 ' + 'items', [[r.yes, 'box-ok', 'truly YES ' + cnt(r.yes), cnt(r.yes) + ' truly YES'], [r.no, 'box-crit', 'truly NO ' + cnt(r.no), cnt(r.no) + ' truly NO']]);
      row(90, 'The judge\'s YES pile: ' + cnt(said) + ' items', [[r.tp, 'box-ok', 'right ' + cnt(r.tp), cnt(r.tp) + ' right'], [r.fp, 'box-crit', 'wrong ' + cnt(r.fp), cnt(r.fp) + ' wrong']]);
      svg.innerHTML = s;
    }
    function set(v) { se.value = v[0]; spc.value = v[1]; pv.value = v[2]; draw(); }
    [se, spc, pv].forEach(function (i) { i.addEventListener('input', draw); });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) { bt.addEventListener('click', function () { set(BP[bt.getAttribute('data-p')]); }); });
    set(BP.casebook);
  }

  H.register('baserate', baseRateWidget);
})();
