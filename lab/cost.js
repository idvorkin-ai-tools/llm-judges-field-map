// p05#cost: expected cost of each cut of a 1..k score, and the cost ratio J implicitly assumes.
(function (root) {
  // yes[i], no[i]: counts at score i+1. Cut t means "YES if score >= t"; t = k+1 is never YES.
  function cutCosts(yes, no, costMiss, costFalseYes) {
    var rows = [], ny = 0, nn = 0, i;
    for (i = 0; i < yes.length; i++) { ny += yes[i]; nn += no[i]; }
    for (var t = yes.length + 1; t >= 1; t--) {
      var tp = 0, fp = 0;
      for (i = t - 1; i < yes.length; i++) { tp += yes[i]; fp += no[i]; }
      var fn = ny - tp;
      rows.push({ t: t, fn: fn, fp: fp, cost: costMiss * fn + costFalseYes * fp, j: tp / ny - fp / nn });
    }
    // best among the real cuts (>= k .. >= 1), as in the page's table; "never YES" is reported separately
    var cuts = rows.slice(1), best = cuts.reduce(function (b, r) { return r.cost < b.cost ? r : b; }, cuts[0]);
    return { rows: rows, never: rows[0], best: best };
  }
  // J's best cut is the cheapest when costMiss * share(YES) = costFalseYes * share(NO).
  function jImpliedRatio(nYes, nNo) { return nNo / nYes; }
  var api = { cutCosts: cutCosts, jImpliedRatio: jImpliedRatio };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
