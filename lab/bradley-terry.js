// p03: Bradley-Terry fit from pairwise win counts, reported on the Elo-style scale
// (400 points = ten-to-one odds) centred on 1000.
// wins[i][j] = times i beat j. Fit by the MM algorithm (Hunter 2004).
(function (root) {
  // The maximum-likelihood fit exists only if every contender can be reached from
  // every other through "beat at least once" links (Zermelo / Ford 1957).
  function connected(wins) {
    var n = wins.length;
    function reach(fwd) {
      var seen = [true], st = [0];
      for (var k = 1; k < n; k++) seen.push(false);
      while (st.length) {
        var i = st.pop();
        for (var j = 0; j < n; j++) if (!seen[j] && (fwd ? wins[i][j] : wins[j][i]) > 0) { seen[j] = true; st.push(j); }
      }
      return seen.every(Boolean);
    }
    return n > 0 && reach(true) && reach(false);
  }
  function btFit(wins, iters) {
    var n = wins.length;
    if (!connected(wins)) return null;
    var p = [], k, i, j;
    for (i = 0; i < n; i++) p.push(1);
    for (k = 0; k < (iters || 2000); k++) {
      var q = [];
      for (i = 0; i < n; i++) {
        var W = 0, den = 0;
        for (j = 0; j < n; j++) if (j !== i) {
          var nij = wins[i][j] + wins[j][i];
          W += wins[i][j];
          if (nij) den += nij / (p[i] + p[j]);
        }
        q.push(W / den);
      }
      var g = Math.exp(q.reduce(function (z, x) { return z + Math.log(x); }, 0) / n);
      p = q.map(function (x) { return x / g; });
    }
    var r = p.map(function (x) { return 400 * Math.log10(x); });
    var mean = r.reduce(function (z, x) { return z + x; }, 0) / n;
    return r.map(function (x) { return 1000 + x - mean; });
  }
  function btWinProb(ri, rj) { return 1 / (1 + Math.pow(10, (rj - ri) / 400)); }
  var api = { btFit: btFit, btWinProb: btWinProb, btConnected: connected };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root.LLMJLab, api);
})(this);
