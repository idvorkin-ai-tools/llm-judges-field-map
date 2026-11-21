// p06#anchoring: the same item graded twice, once after a low prior score and once after a high one.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L) return;
  var mx = H.mx, w = H.w, t = H.t, slider = H.slider, stat = H.stat, $ = H.$;
  function f1(x) { return x.toFixed(1); }
  H.register('anchor', function (el) {
    var p = 'an' + H.uid();
    el.innerHTML =
      '<div class="lab-ctl">' + slider(p + '-o', 'The grade the ' + mx(w('judge')) + ' would give with no prior in view', 1, 5, 0.5, 3.5) +
      slider(p + '-w', 'Pull: how far the grade moves towards the prior', 0, 100, 1, 33) +
      slider(p + '-lo', 'Low prior score shown', 1, 5, 0.5, 2) +
      slider(p + '-hi', 'High prior score shown', 1, 5, 0.5, 5) + '</div>' +
      '<svg class="dg lab-bar" viewBox="0 0 360 120" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<div class="statgrid lab-stats">' + stat('after the low prior', p + '-a') + stat('after the high prior', p + '-b') + stat('gap from the prior alone', p + '-g') + '</div>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var o = $(el, p + '-o'), wt = $(el, p + '-w'), lo = $(el, p + '-lo'), hi = $(el, p + '-hi'), svg = el.querySelector('svg');
    function X(v) { return 20 + (v - 1) * 80; }
    function draw() {
      var own = +o.value, pull = wt.value / 100, a = L.anchored(own, +lo.value, pull), b = L.anchored(own, +hi.value, pull);
      $(el, p + '-o-o').textContent = own; $(el, p + '-w-o').textContent = wt.value + '%';
      $(el, p + '-lo-o').textContent = lo.value; $(el, p + '-hi-o').textContent = hi.value;
      wt.setAttribute('aria-valuetext', wt.value + ' percent of the way to the prior');
      $(el, p + '-a').textContent = f1(a); $(el, p + '-b').textContent = f1(b);
      var g = $(el, p + '-g'); g.textContent = f1(Math.abs(b - a));
      g.className = 'v ' + (Math.abs(b - a) >= 0.5 ? 'lab-bad' : Math.abs(b - a) > 0 ? 'lab-mid' : 'lab-good');
      var s = '<line x1="20" y1="100" x2="340" y2="100" class="ln"/>';
      for (var k = 1; k <= 5; k++) s += t(X(k), 114, k, 't-dim', 'font-size="10" text-anchor="middle"');
      s += '<line x1="' + X(own) + '" y1="14" x2="' + X(own) + '" y2="100" class="ln-def" stroke-dasharray="4 3"/>' +
        t(X(own), 10, 'own grade', 't-def', 'font-size="10" text-anchor="middle"');
      function row(y, prior, got, label) {
        s += '<circle cx="' + X(prior) + '" cy="' + y + '" r="5" class="lab-dot-dim"/>' +
          '<line x1="' + X(prior) + '" y1="' + y + '" x2="' + X(got) + '" y2="' + y + '" class="ln"/>' +
          '<circle cx="' + X(got) + '" cy="' + y + '" r="6" class="lab-pt"/>' +
          t(X(got), y - 10, label + ' → ' + f1(got), 't-ink', 'font-size="10.5" text-anchor="middle"');
      }
      row(44, +lo.value, a, 'prior ' + lo.value); row(82, +hi.value, b, 'prior ' + hi.value);
      svg.innerHTML = s;
      $(el, p + '-sum').textContent = 'The item is the same both times. Shown a prior of ' + lo.value + ' it gets ' + f1(a) + '; shown ' + hi.value + ' it gets ' + f1(b) +
        '. A gap of ' + f1(Math.abs(b - a)) + ' points comes from the prior alone.';
    }
    [o, wt, lo, hi].forEach(function (i) { i.addEventListener('input', draw); });
    draw();
  });
})();
