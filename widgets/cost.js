// p05#cost: price the two mistakes and watch the cheapest cut move along the same five cuts.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L || !L.cutCosts) return;
  var t = H.t, cnt = H.cnt, $ = H.$;
  // slider -100..100 -> ratio 1/20 .. 30 on a log scale; 0 is equal costs
  function ratioAt(v) { return v >= 0 ? Math.pow(30, v / 100) : Math.pow(20, v / 100); }
  function posFor(r) { return r >= 1 ? Math.round(100 * Math.log(r) / Math.log(30)) : Math.round(100 * Math.log(r) / Math.log(20)); }
  function costs(r) { return r >= 1 ? [r, 1] : [1, 1 / r]; } // [cost of a miss, cost of a false YES]
  function nice(r) { return r >= 1 ? (Math.round(r * 10) / 10) + '&times;' : (Math.round(10 / r) / 10) + '&times;'; }
  var PRE = { equal: 1, miss20: 20, fp5: 1 / 5, jay: 140 / 60 };
  H.register('cost', function (el) {
    var p = 'lx' + H.uid();
    el.innerHTML = H.presets([['equal', 'Equal costs'], ['miss20', 'Miss 20&times; worse'], ['fp5', 'False YES 5&times; worse'], ['jay', 'What J assumes']]) +
      '<div class="lab-ctl"><div class="lab-sl lab-wide"><label for="' + p + '-r">Which mistake costs more: false YES &larr; &rarr; missed YES</label>' +
      '<input type="range" id="' + p + '-r" min="-100" max="100" step="1" value="0"><output for="' + p + '-r" id="' + p + '-r-o"></output></div></div>' +
      '<svg class="dg lab-cost" viewBox="0 0 360 180" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>' +
      '<p class="lab-note" id="' + p + '-note"></p>';
    var rIn = $(el, p + '-r'), svg = el.querySelector('.lab-cost'), cur = 1; // presets keep their exact ratio
    function draw() {
      var r = cur, c = costs(r), res = L.cutCosts(L.CASE_YES, L.CASE_NO, c[0], c[1]);
      var label = Math.abs(r - 1) < 1e-9 ? 'both mistakes cost the same' : r > 1 ? 'a miss costs ' + nice(r) + ' a false YES' : 'a false YES costs ' + nice(r) + ' a miss';
      $(el, p + '-r-o').innerHTML = r > 1 ? 'miss ' + nice(r) : r < 1 ? 'false YES ' + nice(r) : 'equal';
      rIn.setAttribute('aria-valuetext', label.replace('&times;', ' times'));
      var cuts = res.rows.slice(1); // >=5 .. >=1
      var max = Math.max.apply(null, cuts.map(function (q) { return q.cost; }));
      var s = '', X0 = 84, BW = 48, base = 132;
      cuts.forEach(function (q, i) {
        var h = 100 * q.cost / max, x = X0 + i * (BW + 6), best = q === res.best;
        s += '<rect x="' + x + '" y="' + (base - h) + '" width="' + BW + '" height="' + h + '" class="' + (best ? 'box-ok' : 'box') + '"/>';
        s += t(x + BW / 2, base - h - 5, cnt(q.cost), best ? 't-ok' : 't-mid', 'font-size="11" text-anchor="middle"' + (best ? ' font-weight="600"' : ''));
        s += t(x + BW / 2, base + 15, '≥ ' + q.t, best ? 't-ok' : 't-dim', 'font-size="11" text-anchor="middle"');
        s += t(x + BW / 2, base + 30, q.fn + ' / ' + q.fp, 't-dim', 'font-size="9.5" text-anchor="middle"');
        if (q.t === 4) s += t(x + BW / 2, base + 44, 'J\'s pick', 't-off', 'font-size="9.5" text-anchor="middle"');
      });
      s += t(X0 - 8, base + 15, 'cut', 't-dim', 'font-size="10" text-anchor="end"');
      s += t(X0 - 8, base + 30, 'miss/false', 't-dim', 'font-size="9" text-anchor="end"');
      s += t(X0 - 8, 30, 'total', 't-dim', 'font-size="10" text-anchor="end"') + t(X0 - 8, 42, 'cost', 't-dim', 'font-size="10" text-anchor="end"');
      svg.innerHTML = s;
      $(el, p + '-sum').innerHTML = 'If ' + label + ', the cheapest cut is ≥ ' + res.best.t + ': ' + res.best.fn + ' misses and ' + res.best.fp + ' false YESes, total cost ' + cnt(res.best.cost) + '.';
      var rg = L.cheapestRange(L.CASE_YES, L.CASE_NO, 4);
      $(el, p + '-note').innerHTML = 'Youden\'s J always picks \u2265 4. Here that is the cheapest cut only while a miss costs between ' +
        (Math.round(rg[0] * 10) / 10) + '&times; and ' + (Math.round(rg[1] * 10) / 10) + '&times; a false YES; J\'s built-in assumption is 140/60 = 2.3&times;, the class balance of the gold set. ' +
        (res.never.cost < res.best.cost ? 'At this ratio, never saying YES at all (cost ' + cnt(res.never.cost) + ') would be cheaper still: the gate would block everything.' : '');
    }
    rIn.addEventListener('input', function () { cur = ratioAt(+rIn.value); draw(); });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) {
      bt.addEventListener('click', function () { cur = PRE[bt.getAttribute('data-p')]; rIn.value = posFor(cur); draw(); });
    });
    draw();
  });
})();
