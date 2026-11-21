// node --test tools/   — checks lab.js against the numbers the pages print.
const test = require('node:test');
const assert = require('node:assert');
const L = require('../../lab.js');

const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('casebook two raters (p04, math#kappa)', () => {
  const r = L.agreement(45, 15, 10, 30);
  near(r.po, 0.75); near(r.pe, 0.51); near(r.kappa, 0.4898); near(r.pi, 0.4885);
  near(r.ppos, 90 / 115); near(r.pneg, 60 / 85);
  assert.equal(L.landisKoch(r.kappa), 'moderate');
});

test('kappa paradox (p04#paradox)', () => {
  const r = L.agreement(2, 4, 4, 90);
  near(r.po, 0.92); near(r.pe, 0.8872); near(r.kappa, 0.2908);
  near(r.ppos, 0.333); near(r.pneg, 0.957);
});

test('lopsided disagreement (math#paradox)', () => {
  near(L.agreement(45, 25, 0, 30).kappa, 0.519);
});

test('perfect, chance and degenerate tables', () => {
  near(L.agreement(50, 0, 0, 50).kappa, 1);
  near(L.agreement(25, 25, 25, 25).kappa, 0);
  assert.ok(L.agreement(10, 40, 40, 10).kappa < 0);
  assert.equal(L.agreement(0, 0, 0, 100).kappa, null); // pe = 1: 0/0
  assert.equal(L.agreement(0, 0, 0, 0).kappa, null);
  assert.equal(L.agreement(0, 0, 0, 100).ppos, null);
  assert.equal(L.landisKoch(null), 'undefined');
});

test('casebook confusion matrix (p05#matrix)', () => {
  const m = L.confusion(48, 12, 21, 119);
  near(m.tpr, 0.80); near(m.tnr, 0.85); near(m.fpr, 0.15); near(m.j, 0.65);
  near(m.precision, 0.696); near(m.npv, 0.908); near(m.accuracy, 0.835); near(m.f1, 0.744);
  assert.equal(L.confusion(0, 60, 0, 140).precision, null); // empty YES pile
  near(L.confusion(0, 60, 0, 140).accuracy, 0.70); // always NO
});

test('thresholds, ROC and AUC (p05#roc, math#roc, math#auc)', () => {
  const c4 = L.cutCounts(L.CASE_YES, L.CASE_NO, 4);
  assert.deepEqual(c4, { tp: 48, fn: 12, fp: 21, tn: 119 });
  const pts = L.rocPoints(L.CASE_YES, L.CASE_NO);
  assert.equal(pts.length, 6);
  const js = pts.slice(1).map(p => +p.j.toFixed(3));
  assert.deepEqual(js, [0.417, 0.65, 0.529, 0.324, 0]);
  near(pts[1].tpr, 0.467); near(pts[1].fpr, 0.05);
  near(pts[3].tpr, 0.90); near(pts[3].fpr, 0.371);
  near(L.aucTrapezoid(pts), 7289 / 8400, 1e-12);
  const pr = L.aucPairs(L.CASE_YES, L.CASE_NO);
  assert.equal(pr.wins, 6832); assert.equal(pr.ties, 914);
  near(pr.auc, 0.868); near(pr.wins / pr.pairs, 0.813); near(pr.ties / pr.pairs, 0.109);
});

test('smooth scores reproduce the casebook cut at separation 1.878', () => {
  const thr = 1.0364; // Phi^-1(0.85)
  const b = L.binormal(1.8780, thr);
  near(b.tpr, 0.80, 1e-3); near(b.fpr, 0.15, 1e-3); near(b.j, 0.65, 2e-3);
  near(L.binormalAuc(0), 0.5, 1e-7);
  near(L.phi(1.96), 0.975, 1e-4);
});

test('base rates (p05#base-rate, math#base-rate)', () => {
  near(L.precisionAt(0.8, 0.85, 0.30), 0.696);
  near(L.npvAt(0.8, 0.85, 0.30), 0.908);
  const r = L.baseRate(0.8, 0.85, 0.05, 1000);
  near(r.tp, 40, 1e-9); near(r.fp, 142.5, 1e-9); near(r.precision, 0.219);
  near(r.npv, 0.988); near(r.accuracy, 0.8475, 1e-9); near(r.alwaysNo, 0.95, 1e-9);
  near(L.precisionAt(0.8, 0.85, 0.01), 0.051); near(L.precisionAt(0.8, 0.85, 0.5), 0.842);
  assert.equal(L.precisionAt(0, 1, 0.3), null);
});
