// Error bars for a proportion (p08#error-bars, math.html#ci, math.html#sample-size).
// Wilson score interval, the Wald (normal-approximation) interval, and the
// normal-approximation sample size n = z²p(1−p)/h². Pure maths, no DOM.
(function (root) {
  var Z95 = 1.959964;
  function wilson(k, n, z) {
    if (!(n > 0)) return null;
    z = z || Z95;
    var p = k / n, z2 = z * z, den = 1 + z2 / n;
    var centre = (p + z2 / (2 * n)) / den;
    var half = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
    return { p: p, centre: centre, half: half, lo: centre - half, hi: centre + half };
  }
  function wald(k, n, z) {
    if (!(n > 0)) return null;
    z = z || Z95;
    var p = k / n, half = z * Math.sqrt(p * (1 - p) / n);
    return { p: p, centre: p, half: half, lo: p - half, hi: p + half };
  }
  // Items needed so the normal-approximation half-width is h at proportion p.
  function nForHalfWidth(p, h, z) {
    z = z || Z95;
    return h > 0 ? z * z * p * (1 - p) / (h * h) : null;
  }
  var api = { Z95: Z95, wilson: wilson, wald: wald, nForHalfWidth: nForHalfWidth };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
