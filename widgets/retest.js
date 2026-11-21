// p01: grade the same items twice. Bias (reliably wrong items) lowers accuracy but not
// self-agreement; noise (coin-flip readings) lowers both, and self-agreement caps accuracy.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L || !L.retest) return;
  var mx = H.mx, w = H.w, t = H.t, pct = H.pct, slider = H.slider, stat = H.stat, presets = H.presets, $ = H.$;
  var PRE = { valid: [0, 5], biased: [30, 5], noisy: [0, 60], neither: [30, 60] };
  var N = 20;

  H.register('retest', function (el) {
    var p = 'rt' + H.uid();
    el.innerHTML =
      presets([['valid', 'Reliable + valid'], ['biased', 'Reliable, biased'], ['noisy', 'Centred, noisy'], ['neither', 'Neither']]) +
      '<div class="lab-ctl">' +
      slider(p + '-b', 'Bias: share of ' + mx(w('items')) + ' the ' + mx(w('judge')) + ' gets wrong every time', 0, 50, 1, 0) +
      slider(p + '-f', 'Noise: chance any one reading is a coin flip', 0, 100, 1, 5) +
      '</div>' +
      '<svg class="dg lab-bar" viewBox="0 0 360 150" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('self-agreement: two readings match', p + '-sa') +
      stat('accuracy: a reading is right', p + '-acc') + stat('best accuracy this self-agreement allows', p + '-cap') + '</div>' +
      '<p class="lab-note">Self-agreement is reliability; accuracy is validity. The ceiling assumes the two readings are independent: (1 + &radic;(2a &minus; 1)) / 2 for self-agreement a.</p>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var bi = $(el, p + '-b'), fi = $(el, p + '-f'), svg = el.querySelector('svg');

    function draw() {
      var b = bi.value / 100, f = fi.value / 100, r = L.retest(b, f);
      $(el, p + '-b-o').textContent = bi.value + '%';
      $(el, p + '-f-o').textContent = fi.value + '%';
      bi.setAttribute('aria-valuetext', bi.value + ' percent of items always wrong');
      fi.setAttribute('aria-valuetext', fi.value + ' percent chance a reading is a coin flip');
      $(el, p + '-sa').innerHTML = pct(r.selfAgree);
      var acc = $(el, p + '-acc');
      acc.innerHTML = pct(r.accuracy);
      acc.className = 'v ' + (r.accuracy < 0.7 ? 'lab-bad' : r.accuracy > 0.9 ? 'lab-good' : 'lab-mid');
      $(el, p + '-cap').innerHTML = pct(r.ceiling);
      // Sample: N items, two readings each, from a fixed seed so the picture is stable.
      var rnd = L.rng(7), nBad = Math.round(b * N), s = '';
      s += t(4, 14, 'reading 1', 't-dim', 'font-size="10.5" text-anchor="start"');
      s += t(4, 52, 'reading 2', 't-dim', 'font-size="10.5" text-anchor="start"');
      var match = 0;
      for (var i = 0; i < N; i++) {
        var bad = i >= N - nBad, x = 70 + i * 14.4;
        var reads = [0, 1].map(function () {
          var right = !bad;
          if (rnd() < f) right = rnd() < 0.5;
          else rnd();
          return right;
        });
        if (reads[0] === reads[1]) match++;
        reads.forEach(function (ok, k) {
          s += '<rect x="' + x + '" y="' + (k ? 40 : 2) + '" width="11" height="16" rx="2" class="' + (ok ? 'lab-ok' : 'lab-crit') + '"/>';
        });
        if (reads[0] !== reads[1]) s += t(x + 5.5, 33, '&#8800;', 't-off', 'font-size="11" text-anchor="middle"');
      }
      s += t(70, 72, 'sample of ' + N + ': red wrong, &#8800; readings differ', 't-dim', 'font-size="10" text-anchor="start"');
      // Bars: self-agreement, accuracy with the ceiling tick.
      function bar(y, label, v, cls) {
        s += t(4, y + 12, label, 't-ink', 'font-size="11" text-anchor="start"');
        s += '<rect x="110" y="' + y + '" width="230" height="16" class="box"/>';
        s += '<rect x="110" y="' + y + '" width="' + (230 * v).toFixed(1) + '" height="16" class="' + cls + '"/>';
      }
      bar(86, 'self-agreement', r.selfAgree, 'lab-dot');
      bar(114, 'accuracy', r.accuracy, r.accuracy < 0.7 ? 'lab-crit' : 'lab-ok');
      if (r.ceiling !== null) {
        var cx = (110 + 230 * r.ceiling).toFixed(1);
        s += '<line x1="' + cx + '" y1="108" x2="' + cx + '" y2="136" class="ln-def" stroke-width="2"/>';
        s += t(cx, 146, 'ceiling', 't-def', 'font-size="10" text-anchor="middle"');
      }
      svg.innerHTML = s;
      $(el, p + '-sum').textContent = 'Graded twice, the judge agrees with itself on ' + pct(r.selfAgree) + ' of items and is right on ' + pct(r.accuracy) +
        '; with that self-agreement no judge could be right on more than ' + pct(r.ceiling) + '.';
    }
    function set(v) { bi.value = v[0]; fi.value = v[1]; draw(); }
    [bi, fi].forEach(function (i) { i.addEventListener('input', draw); });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) { bt.addEventListener('click', function () { set(PRE[bt.getAttribute('data-p')]); }); });
    el.labPreset = function (k) { if (PRE[k]) set(PRE[k]); };
    set(PRE.valid);
  });
})();
