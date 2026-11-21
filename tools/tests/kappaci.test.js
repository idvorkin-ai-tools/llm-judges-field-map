const test = require('node:test');
const assert = require('node:assert');
const C = require('../../lab/kappaci.js');
const near = (got, want, tol = 5e-3) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('casebook kappa interval 0.32 to 0.66 (p04#benchmarks, math#ci)', () => {
  const r = C.kappaInterval(0.75, 0.51, 100);
  near(r.se, 0.0884, 1e-4); near(r.lo, 0.32); near(r.hi, 0.66); near(r.half, 0.1732, 1e-4);
});
test('Wilson interval for 75/100 is 0.657 to 0.825; 48/60 is 0.682 to 0.882', () => {
  const w = C.wilson(0.75, 100); near(w.lo, 0.657, 1e-3); near(w.hi, 0.825, 1e-3);
  const s = C.wilson(0.8, 60); near(s.lo, 0.682, 1e-3); near(s.hi, 0.882, 1e-3);
});
test('items for a kappa half-width (math#sample-size): 104, 300, 1200', () => {
  near(C.itemsForKappa(0.75, 0.51, 0.17), 104, 0.5);
  near(C.itemsForKappa(0.75, 0.51, 0.10), 300, 0.5);
  near(C.itemsForKappa(0.75, 0.51, 0.05), 1200, 1);
});
test('degenerate inputs give null, not NaN', () => {
  assert.equal(C.kappaInterval(1, 1, 100), null);
  assert.equal(C.kappaInterval(0.75, 0.51, 0), null);
  assert.equal(C.wilson(0.5, 0), null);
});
