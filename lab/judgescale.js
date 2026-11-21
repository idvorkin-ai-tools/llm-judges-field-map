// p07#scale maths: pass rates for a 1-5 score histogram. No DOM.
(function (root) {
  // The four illustrative judges of p07#scale: counts of scores 1..5 on the same 100 items.
  var JUDGES = {
    reference: [10, 20, 30, 25, 15],
    lenient: [2, 6, 17, 35, 40],
    severe: [30, 32, 22, 11, 5],
    compressed: [2, 10, 76, 10, 2]
  };
  // Items scoring at or above `cut` (1..5).
  function passAt(hist, cut) {
    var s = 0;
    for (var k = cut; k <= 5; k++) s += hist[k - 1];
    return s;
  }
  function mean(hist) {
    var n = 0, s = 0;
    hist.forEach(function (c, i) { n += c; s += c * (i + 1); });
    return n > 0 ? s / n : null;
  }
  // The cut on this judge whose pass count is closest to `target` (ties go to the higher cut).
  function matchingCut(hist, target) {
    var best = null;
    for (var c = 1; c <= 5; c++) {
      var d = Math.abs(passAt(hist, c) - target);
      if (best === null || d <= best.gap) best = { cut: c, pass: passAt(hist, c), gap: d };
    }
    return best;
  }
  var api = { JUDGES: JUDGES, passAt: passAt, histMean: mean, matchingCut: matchingCut };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
