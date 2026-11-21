// p07#goodhart maths: proxy and gold score as optimisation pushes on a judge. No DOM.
(function (root) {
  // Gao, Schulman and Hilton 2022 fit best-of-n gold reward as d(alpha - beta d), d = sqrt(KL).
  // The proxy here is drawn as alpha d: an illustrative judge score that keeps climbing.
  function goodhart(d, alpha, beta) {
    return { proxy: alpha * d, gold: d * (alpha - beta * d) };
  }
  function goodhartPeak(alpha, beta) {
    if (!(beta > 0)) return null;
    var d = alpha / (2 * beta);
    return { d: d, gold: alpha * alpha / (4 * beta) };
  }
  var api = { goodhart: goodhart, goodhartPeak: goodhartPeak };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
