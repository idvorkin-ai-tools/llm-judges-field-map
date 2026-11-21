// p09#one-case: an imperfect judge measuring two systems' pass rates.
// measured = sens·t + (1 − spec)·(1 − t) = (1 − spec) + J·t, so a true gap shrinks by J
// but keeps its sign; Rogan–Gladen inverts it. Pure maths, no DOM.
(function (root) {
  function measured(t, sens, spec) { return sens * t + (1 - spec) * (1 - t); }
  // Rogan and Gladen (1978): true rate from a measured one.
  function roganGladen(m, sens, spec) {
    var j = sens + spec - 1;
    return Math.abs(j) > 1e-12 ? (m + spec - 1) / j : null;
  }
  // Two independent measured rates on n items each: gap, its standard error, gap / SE.
  function gapZ(mA, mB, nA, nB) {
    var se = Math.sqrt(mA * (1 - mA) / nA + mB * (1 - mB) / nB);
    return { gap: mA - mB, se: se, z: se > 0 ? (mA - mB) / se : null };
  }
  var api = { measured: measured, roganGladen: roganGladen, gapZ: gapZ };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
