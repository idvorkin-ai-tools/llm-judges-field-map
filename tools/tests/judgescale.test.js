// node --test tools/   — p07 scale histograms.
const test = require('node:test');
const assert = require('node:assert');
const L = require('../../lab/judgescale.js');
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('each illustrative judge scores 100 items', () => {
  Object.values(L.JUDGES).forEach((h) => assert.equal(h.reduce((a, b) => a + b, 0), 100));
});

test('pass at cut 4 (p07#scale figure): 40 / 75 / 16 / 12', () => {
  assert.equal(L.passAt(L.JUDGES.reference, 4), 40);
  assert.equal(L.passAt(L.JUDGES.lenient, 4), 75);
  assert.equal(L.passAt(L.JUDGES.severe, 4), 16);
  assert.equal(L.passAt(L.JUDGES.compressed, 4), 12);
  assert.equal(L.JUDGES.compressed[2], 76);
  assert.equal(L.passAt(L.JUDGES.reference, 1), 100);
});

test('a lenient cut sits lower: moving the cut recovers the reference pass rate', () => {
  assert.deepEqual(L.matchingCut(L.JUDGES.lenient, 40), { cut: 5, pass: 40, gap: 0 });
  assert.deepEqual(L.matchingCut(L.JUDGES.severe, 40), { cut: 3, pass: 38, gap: 2 });
  // compressed: 88 at cut 3, 12 at cut 4: no cut gets near 40
  const c = L.matchingCut(L.JUDGES.compressed, 40);
  assert.equal(c.cut, 4); assert.equal(c.gap, 28);
});

test('means', () => {
  near(L.histMean(L.JUDGES.reference), 3.15);
  near(L.histMean(L.JUDGES.compressed), 3.0);
});
