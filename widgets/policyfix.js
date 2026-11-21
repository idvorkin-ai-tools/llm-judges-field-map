// p02: the casebook's 25 splits; rewriting the policy settles some, and kappa climbs.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L || !L.policyFix) return;
  var mx = H.mx, w = H.w, t = H.t, f2 = H.f2, cnt = H.cnt, pct = H.pct, slider = H.slider, stat = H.stat, presets = H.presets, $ = H.$;
  var CB = [45, 15, 10, 30];
  var PRE = { asis: [0, 50], most: [20, 50], all: [25, 50] };

  H.register('policyfix', function (el) {
    var p = 'pf' + H.uid();
    el.innerHTML =
      presets([['asis', 'Before any rewrite'], ['most', 'Rewrite settles 20, 5 slips left'], ['all', 'Every split settled']]) +
      '<div class="lab-ctl">' +
      slider(p + '-s', 'Splits settled by rewriting the policy (of 25)', 0, 25, 1, 0) +
      slider(p + '-y', 'Rulings that come out ' + mx(w('yes')), 0, 100, 5, 50) +
      '</div>' +
      '<svg class="dg lab-bar" viewBox="0 0 360 150" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('percent agreement', p + '-po') + stat('Cohen\'s kappa', p + '-k') + stat('splits left', p + '-left') + '</div>' +
      '<p class="lab-note">Assumption: settled splits come from the two kinds of split in proportion (15 : 10), and each ruling makes both raters say the same thing. Slips the policy already covered stay split.</p>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var si = $(el, p + '-s'), yi = $(el, p + '-y'), svg = el.querySelector('svg');

    function draw() {
      var settled = +si.value, ys = yi.value / 100;
      var v = L.policyFix(CB[0], CB[1], CB[2], CB[3], settled, ys), r = L.agreement(v[0], v[1], v[2], v[3]);
      $(el, p + '-s-o').textContent = settled;
      $(el, p + '-y-o').textContent = yi.value + '%';
      si.setAttribute('aria-valuetext', settled + ' of 25 splits settled');
      yi.setAttribute('aria-valuetext', yi.value + ' percent of rulings are YES');
      $(el, p + '-po').innerHTML = pct(r.po);
      var kv = $(el, p + '-k');
      kv.innerHTML = f2(r.kappa);
      kv.className = 'v ' + (r.kappa === null ? '' : r.kappa < 0.4 ? 'lab-bad' : r.kappa > 0.8 ? 'lab-good' : 'lab-mid');
      $(el, p + '-left').innerHTML = cnt(25 - settled);
      // 100 items as a 20 x 5 grid: original agreements, settled splits, remaining splits.
      var s = '', i, kinds = [];
      for (i = 0; i < 75; i++) kinds.push('agree');
      for (i = 0; i < 25; i++) kinds.push(i < settled ? 'settled' : 'split');
      kinds.forEach(function (k, n) {
        var x = 10 + (n % 20) * 17, y = 6 + Math.floor(n / 20) * 17;
        var cls = k === 'agree' ? 'lab-ok-dim' : k === 'settled' ? 'lab-ok' : 'lab-crit';
        s += '<rect x="' + x + '" y="' + y + '" width="14" height="14" rx="2" class="' + cls + '"/>';
      });
      s += t(10, 108, 'agreed already', 't-dim', 'font-size="10.5" text-anchor="start"');
      s += t(180, 108, 'settled by a rewrite', 't-ok', 'font-size="10.5" text-anchor="middle"');
      s += t(350, 108, 'still split', 't-crit', 'font-size="10.5" text-anchor="end"');
      var kx = r.kappa === null ? 0 : Math.max(0, r.kappa);
      s += t(10, 134, 'kappa', 't-ink', 'font-size="11" text-anchor="start"');
      s += '<rect x="60" y="122" width="290" height="16" class="box"/>';
      s += '<rect x="60" y="122" width="' + (290 * kx).toFixed(1) + '" height="16" class="' + (kx > 0.8 ? 'lab-ok' : 'lab-dot') + '"/>';
      var x49 = (60 + 290 * 0.4898).toFixed(1);
      s += '<line x1="' + x49 + '" y1="118" x2="' + x49 + '" y2="142" class="ln-def" stroke-dasharray="3 3"/>';
      s += t(x49, 150, 'start 0.49', 't-def', 'font-size="9.5" text-anchor="middle"');
      svg.innerHTML = s;
      $(el, p + '-sum').textContent = 'With ' + settled + ' of 25 splits settled by the policy, the raters agree on ' + pct(r.po) + ' of items and kappa is ' + f2(r.kappa) + '.';
    }
    function set(v) { si.value = v[0]; yi.value = v[1]; draw(); }
    [si, yi].forEach(function (i) { i.addEventListener('input', draw); });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) { bt.addEventListener('click', function () { set(PRE[bt.getAttribute('data-p')]); }); });
    el.labPreset = function (k) { if (PRE[k]) set(PRE[k]); };
    set(PRE.asis);
  });
})();
