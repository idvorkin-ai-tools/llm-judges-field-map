// The arithmetic behind the interactive widgets, kept apart from the DOM so
// tools/lab.test.js can check it against the numbers the pages print.
// Every formula here is the one written out in parts/math.html.
// Loads as a classic script (window.LLMJLab) and as a CommonJS module.
(function (root) {
  function ratio(num, den) { return den > 0 ? num / den : null; }

  // Two raters, one YES/NO label. a = both YES, b = A YES B NO, c = A NO B YES, d = both NO.
  function agreement(a, b, c, d) {
    var n = a + b + c + d;
    if (!(n > 0)) return { n: 0, po: null, pe: null, kappa: null, pi: null, ppos: null, pneg: null, aYes: null, bYes: null };
    var aYes = (a + b) / n, bYes = (a + c) / n;
    var po = (a + d) / n;
    var pe = aYes * bYes + (1 - aYes) * (1 - bYes);
    var pbar = (aYes + bYes) / 2, pePi = pbar * pbar + (1 - pbar) * (1 - pbar);
    return {
      n: n, po: po, pe: pe, aYes: aYes, bYes: bYes,
      // 1 - pe = 0 only when both raters gave one answer to everything: kappa is 0/0, undefined.
      kappa: 1 - pe > 1e-12 ? (po - pe) / (1 - pe) : null,
      pi: 1 - pePi > 1e-12 ? (po - pePi) / (1 - pePi) : null,
      ppos: ratio(2 * a, 2 * a + b + c),
      pneg: ratio(2 * d, 2 * d + b + c)
    };
  }

  // Landis and Koch's words (1977) for a kappa value.
  function landisKoch(k) {
    if (k === null) return 'undefined';
    if (k < 0) return 'worse than chance';
    if (k <= 0.20) return 'slight';
    if (k <= 0.40) return 'fair';
    if (k <= 0.60) return 'moderate';
    if (k <= 0.80) return 'substantial';
    return 'almost perfect';
  }

  // Judge against truth. tp, fn = truly YES row; fp, tn = truly NO row.
  function confusion(tp, fn, fp, tn) {
    var n = tp + fn + fp + tn;
    var tpr = ratio(tp, tp + fn), tnr = ratio(tn, tn + fp);
    return {
      n: n, tpr: tpr, tnr: tnr,
      fpr: tnr === null ? null : 1 - tnr,
      precision: ratio(tp, tp + fp),
      npv: ratio(tn, tn + fn),
      accuracy: ratio(tp + tn, n),
      f1: ratio(2 * tp, 2 * tp + fp + fn),
      j: tpr === null || tnr === null ? null : tpr + tnr - 1
    };
  }

  // Bayes' rule, math.html#base-rate.
  function precisionAt(sens, spec, prev) {
    return ratio(sens * prev, sens * prev + (1 - spec) * (1 - prev));
  }
  function npvAt(sens, spec, prev) {
    return ratio(spec * (1 - prev), spec * (1 - prev) + (1 - sens) * prev);
  }
  // Expected counts for `total` items: the natural-frequency view the pages use.
  function baseRate(sens, spec, prev, total) {
    var yes = total * prev, no = total - yes;
    var tp = sens * yes, fp = (1 - spec) * no;
    return {
      yes: yes, no: no, tp: tp, fn: yes - tp, fp: fp, tn: no - fp,
      precision: precisionAt(sens, spec, prev), npv: npvAt(sens, spec, prev),
      accuracy: sens * prev + spec * (1 - prev),
      alwaysNo: 1 - prev, j: sens + spec - 1
    };
  }

  // A 1..k score cut at "YES if score >= t". yes[i], no[i] are counts at score i+1.
  function cutCounts(yes, no, t) {
    var tp = 0, fp = 0, ny = 0, nn = 0;
    for (var i = 0; i < yes.length; i++) {
      ny += yes[i]; nn += no[i];
      if (i + 1 >= t) { tp += yes[i]; fp += no[i]; }
    }
    return { tp: tp, fn: ny - tp, fp: fp, tn: nn - fp };
  }
  // ROC points from strict (never YES) to lenient (always YES).
  function rocPoints(yes, no) {
    var pts = [];
    for (var t = yes.length + 1; t >= 1; t--) {
      var c = cutCounts(yes, no, t), m = confusion(c.tp, c.fn, c.fp, c.tn);
      pts.push({ t: t, fpr: m.fpr, tpr: m.tpr, j: m.j });
    }
    return pts;
  }
  function aucTrapezoid(pts) {
    var s = 0;
    for (var i = 1; i < pts.length; i++) s += (pts[i].fpr - pts[i - 1].fpr) * (pts[i].tpr + pts[i - 1].tpr) / 2;
    return s;
  }
  // Mann-Whitney reading: P(YES item outscores NO item), ties count half.
  function aucPairs(yes, no) {
    var wins = 0, ties = 0, ny = 0, nn = 0, below = 0;
    for (var i = 0; i < no.length; i++) nn += no[i];
    for (i = 0; i < yes.length; i++) {
      ny += yes[i];
      wins += yes[i] * below; ties += yes[i] * no[i];
      below += no[i];
    }
    return { wins: wins, ties: ties, pairs: ny * nn, auc: (wins + ties / 2) / (ny * nn) };
  }

  // Standard normal CDF (Abramowitz and Stegun 7.1.26 via erf; error < 1.5e-7).
  function phi(x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x / 2);
    return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  }
  function normPdf(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }
  // Smooth scores: truly-NO items ~ N(0,1), truly-YES ~ N(sep,1), YES if score >= thr.
  function binormal(sep, thr) {
    var tpr = 1 - phi(thr - sep), fpr = 1 - phi(thr);
    return { tpr: tpr, fpr: fpr, j: tpr - fpr };
  }
  function binormalAuc(sep) { return phi(sep / Math.SQRT2); }

  var api = {
    agreement: agreement, landisKoch: landisKoch, confusion: confusion,
    precisionAt: precisionAt, npvAt: npvAt, baseRate: baseRate,
    cutCounts: cutCounts, rocPoints: rocPoints, aucTrapezoid: aucTrapezoid, aucPairs: aucPairs,
    phi: phi, normPdf: normPdf, binormal: binormal, binormalAuc: binormalAuc,
    // The casebook judge's 1-5 scores (p05#roc, math.html#roc).
    CASE_YES: [2, 4, 6, 20, 28], CASE_NO: [50, 38, 31, 14, 7]
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LLMJLab = api;
})(this);
