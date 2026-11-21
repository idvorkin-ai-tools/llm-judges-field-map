// p01: grade the same items twice. Two knobs: bias b (share of items the judge is
// reliably wrong on) and noise f (chance any one reading is replaced by a coin flip).
// Readings are independent given the item.
(function (root) {
  function retest(b, f) {
    var qGood = 1 - f / 2, qBad = f / 2; // chance one reading is right, per item kind
    var accuracy = (1 - b) * qGood + b * qBad;
    // Two readings match when both are right or both wrong; the same for both kinds.
    var selfAgree = qGood * qGood + (1 - qGood) * (1 - qGood);
    return { accuracy: accuracy, selfAgree: selfAgree, ceiling: ceiling(selfAgree) };
  }
  // Best accuracy any judge can have given its self-agreement a (independent readings):
  // E[q(1-q)] = (1-a)/2 and Jensen give E[q] <= (1 + sqrt(2a - 1)) / 2.
  function ceiling(a) { return a < 0.5 ? null : (1 + Math.sqrt(2 * a - 1)) / 2; }
  // Deterministic pseudo-random stream for drawing sample readings.
  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  var api = { retest: retest, retestCeiling: ceiling, rng: rng };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
