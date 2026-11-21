// p07#scale: four judges, the same 100 items, one movable pass cut.
(function () {
  var H = window.LLMJWidgets, L = window.LLMJLab;
  if (!H || !L) return;
  var mx = H.mx, w = H.w, t = H.t, f2 = H.f2, slider = H.slider, $ = H.$;
  var ORDER = [['reference', 'reference', 't-ink'], ['lenient', 'lenient', 't-off'], ['severe', 'severe', 't-crit'], ['compressed', 'compressed', 't-def']];
  H.register('judgescale', function (el) {
    var p = 'js' + H.uid();
    el.innerHTML =
      '<div class="lab-ctl">' + slider(p + '-c', 'Pass cut: a score at or above this counts as ' + mx(w('yes')), 2, 5, 1, 4) + '</div>' +
      '<svg class="dg lab-grid" viewBox="0 0 360 250" role="img" aria-labelledby="' + p + '-sum"></svg>' +
      '<p class="lab-note" id="' + p + '-m"></p>' +
      '<p class="lab-sum" id="' + p + '-sum" aria-live="polite"></p>';
    var c = $(el, p + '-c'), svg = el.querySelector('svg');
    function draw() {
      var cut = +c.value, s = '', sum = [];
      $(el, p + '-c-o').textContent = '≥ ' + cut;
      c.setAttribute('aria-valuetext', 'pass at ' + cut + ' or above');
      ORDER.forEach(function (o, idx) {
        var h = L.JUDGES[o[0]], ox = (idx % 2) * 180, oy = Math.floor(idx / 2) * 124, base = oy + 96, pass = L.passAt(h, cut);
        s += t(ox + 85, oy + 14, o[1], o[2], 'font-size="11.5" font-weight="600" text-anchor="middle"');
        s += '<line x1="' + (ox + 10) + '" y1="' + base + '" x2="' + (ox + 160) + '" y2="' + base + '" class="ln"/>';
        h.forEach(function (n, k) {
          var x = ox + 14 + k * 29, ht = n * 0.9;
          s += '<rect x="' + x + '" y="' + (base - ht) + '" width="22" height="' + ht + '" class="' + (k + 1 >= cut ? 'box-def' : 'box') + '"/>' +
            t(x + 11, base - ht - 3, n, 't-dim', 'font-size="9.5" text-anchor="middle"') +
            t(x + 11, base + 11, k + 1, 't-dim', 'font-size="9.5" text-anchor="middle"');
        });
        var cx = ox + 14 + (cut - 1) * 29 - 3.5;
        s += '<line x1="' + cx + '" y1="' + (oy + 22) + '" x2="' + cx + '" y2="' + (base + 2) + '" class="ln-def" stroke-dasharray="4 3"/>';
        s += t(ox + 85, base + 24, pass + ' of 100 pass', o[2], 'font-size="11" text-anchor="middle"');
        sum.push(o[1] + ' ' + pass);
      });
      svg.innerHTML = s;
      var ref = L.passAt(L.JUDGES.reference, cut);
      var m = ['lenient', 'severe', 'compressed'].map(function (k) {
        var r = L.matchingCut(L.JUDGES[k], ref);
        return k + ': ' + (r.gap <= 3 ? 'cut ≥ ' + r.cut + ' gives ' + r.pass : 'no cut comes close (nearest ' + r.pass + ')');
      });
      $(el, p + '-m').textContent = 'To pass the reference’s ' + ref + ', move each judge’s cut. ' + m.join(' · ') + '. Means: ' +
        ORDER.map(function (o) { return o[0] + ' ' + f2(L.histMean(L.JUDGES[o[0]])); }).join(', ') + '.';
      $(el, p + '-sum').textContent = 'At a cut of ' + cut + ': ' + sum.join(', ') + ' of the same 100 items pass.';
    }
    c.addEventListener('input', draw);
    draw();
  });
})();
