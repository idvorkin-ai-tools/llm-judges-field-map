// p02: the casebook raters split on 25 of 100 (15 A-yes/B-no, 10 A-no/B-yes).
// Rewriting the policy settles `settled` of those splits; the rest stay split.
// Assumptions, stated on the page: settled splits are taken from the two
// off-diagonal cells in proportion to their size, and a share `yesShare` of the
// rulings come out YES (both raters now say YES), the rest NO.
(function (root) {
  function policyFix(a, b, c, d, settled, yesShare) {
    var off = b + c;
    var s = Math.max(0, Math.min(settled, off));
    var fb = off ? s * b / off : 0, fc = off ? s * c / off : 0;
    return [a + s * yesShare, b - fb, c - fc, d + s * (1 - yesShare)];
  }
  var api = { policyFix: policyFix };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
