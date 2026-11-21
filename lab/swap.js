// p06#position maths: the swap test. No DOM.
(function (root) {
  function ratio(num, den) { return den > 0 ? num / den : null; }
  // n pairs judged in both orders: `first` flip to whichever is shown first,
  // `second` flip to whichever is shown second, the rest are consistent.
  // xBetter: share of the consistent pairs that model X truly wins (0..1).
  // "single" is a script that always shows X first; "both" counts a flip as a tie.
  function swapTest(n, first, second, xBetter) {
    var flips = first + second, consistent = n - flips;
    return {
      consistent: consistent, flips: flips,
      swapRate: ratio(flips, n),
      firstShare: ratio(first, flips),
      swing: first - second,
      single: { x: xBetter * consistent + first, rival: (1 - xBetter) * consistent + second },
      both: { x: xBetter * consistent, rival: (1 - xBetter) * consistent, ties: flips }
    };
  }
  var api = { swapTest: swapTest };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
