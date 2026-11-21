// p06#position: run 100 pairs in both orders; see what a fixed order does to a win rate.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L) return;
  var mx = H.mx, w = H.w, t = H.t, cnt = H.cnt, pct = H.pct, slider = H.slider, stat = H.stat, $ = H.$;
  var P = { casebook: [30, 8, 50], gpt4: [30, 5, 50], claude: [75, 1, 50], fair: [0, 0, 50] };
  H.register('swap', function (el) {
    var p = 'sw' + H.uid();
    el.innerHTML =
      H.presets([['casebook', 'Casebook 62/30/8'], ['gpt4', 'GPT-4, Zheng 65/30/5'], ['claude', 'Claude-v1, Zheng ~24/75/1'], ['fair', 'No position bias']]) +
      '<div class="lab-ctl">' + slider(p + '-f', 'Pairs that flip to whichever is shown <b>first</b>', 0, 100, 1, 30) +
      slider(p + '-s', 'Pairs that flip to whichever is shown <b>second</b>', 0, 100, 1, 8) +
      slider(p + '-q', 'Of the consistent pairs, share where X is truly better', 0, 100, 1, 50) + '</div>' +
      '<svg class="dg lab-bar" viewBox="0 0 360 150" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('swap rate', p + '-sr') + stat('flips going to slot 1', p + '-fs') +
      stat('X\'s free swing', p + '-sw') + '</div>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var f = $(el, p + '-f'), s = $(el, p + '-s'), q = $(el, p + '-q'), svg = el.querySelector('svg');
    function draw(changed) {
      var F = +f.value, S = +s.value;
      if (F + S > 100) { if (changed === s) { S = 100 - F; s.value = S; } else { F = 100 - S; f.value = F; } }
      var r = L.swapTest(100, F, S, q.value / 100);
      $(el, p + '-f-o').textContent = F; $(el, p + '-s-o').textContent = S; $(el, p + '-q-o').textContent = q.value + '%';
      f.setAttribute('aria-valuetext', F + ' pairs'); s.setAttribute('aria-valuetext', S + ' pairs'); q.setAttribute('aria-valuetext', q.value + ' percent');
      $(el, p + '-sr').textContent = pct(r.swapRate);
      $(el, p + '-fs').textContent = r.firstShare === null ? '—' : pct(r.firstShare);
      var sw = $(el, p + '-sw'); sw.textContent = (r.swing > 0 ? '+' : '') + r.swing + ' pairs';
      sw.className = 'v ' + (Math.abs(r.swing) >= 10 ? 'lab-bad' : Math.abs(r.swing) >= 3 ? 'lab-mid' : 'lab-good');
      var X0 = 10, WD = 340, out = '';
      function bar(y, title, parts) {
        out += t(X0, y - 6, title, 't-ink', 'font-size="11" font-weight="600"');
        var x = X0;
        parts.forEach(function (b) {
          var wd = WD * b[0] / 100;
          if (wd > 0) out += '<rect x="' + x + '" y="' + y + '" width="' + wd + '" height="26" class="' + b[1] + '"/>';
          if (wd > 44) out += t(x + wd / 2, y + 17, b[2] + ' ' + cnt(b[0]), 't-ink', 'font-size="10.5" text-anchor="middle"');
          x += wd;
        });
      }
      bar(22, 'X always shown first', [[r.single.x, 'box-off', 'X'], [r.single.rival, 'box-def', 'rival']]);
      bar(90, 'Both orders, a flip counts as a tie', [[r.both.x, 'box-off', 'X'], [r.both.ties, 'box', 'tie'], [r.both.rival, 'box-def', 'rival']]);
      svg.innerHTML = out;
      $(el, p + '-sum').textContent = 'Shown first every time, X wins ' + cnt(r.single.x) + ' of 100 pairs. Judged both ways it wins ' + cnt(r.both.x) +
        ', ties ' + r.both.ties + ' and loses ' + cnt(r.both.rival) + ': the slot was worth ' + r.swing + ' pairs.';
    }
    function set(v) { f.value = v[0]; s.value = v[1]; q.value = v[2]; draw(); }
    [f, s, q].forEach(function (i) { i.addEventListener('input', function () { draw(i); }); });
    el.querySelectorAll('.lab-pre button').forEach(function (bt) { bt.addEventListener('click', function () { set(P[bt.getAttribute('data-p')]); }); });
    el.labPreset = function (k) { if (P[k]) set(P[k]); };
    set(P.casebook);
  });
})();
