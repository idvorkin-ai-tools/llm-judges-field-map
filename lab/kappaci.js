// p04 error bars: the large-sample kappa interval and the Wilson interval for
// percent agreement, both as written out in math.html#ci and #sample-size.
(function (root) {
  var Z = 1.96;
  // SE(kappa) ~ sqrt(po(1-po) / (n (1-pe)^2)), treating pe as fixed (McHugh 2012).
  function kappaInterval(po, pe, n) {
    if (!(n > 0) || !(1 - pe > 0)) return null;
    var k = (po - pe) / (1 - pe), se = Math.sqrt(po * (1 - po) / (n * (1 - pe) * (1 - pe)));
    return { kappa: k, se: se, lo: k - Z * se, hi: k + Z * se, half: Z * se };
  }
  function wilson(p, n) {
    if (!(n > 0)) return null;
    var z2 = Z * Z, den = 1 + z2 / n, c = (p + z2 / (2 * n)) / den;
    var h = Z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
    return { centre: c, lo: c - h, hi: c + h, half: h };
  }
  // n ~ z^2 po(1-po) / (h^2 (1-pe)^2): items for a kappa half-width h.
  function itemsForKappa(po, pe, h) { return Z * Z * po * (1 - po) / (h * h * (1 - pe) * (1 - pe)); }
  var api = { kappaInterval: kappaInterval, wilson: wilson, itemsForKappa: itemsForKappa };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
