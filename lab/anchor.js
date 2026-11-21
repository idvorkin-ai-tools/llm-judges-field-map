// p06#anchoring maths: a linear pull towards the number in the prompt. No DOM.
(function (root) {
  // The grade moves a fraction `pull` (0..1) of the way from the judge's own grade to the anchor.
  function anchored(own, anchor, pull) { return own + pull * (anchor - own); }
  var api = { anchored: anchored };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
