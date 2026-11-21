const test = require('node:test');
const assert = require('node:assert');
const L = require('../../lab.js');
const C = require('../../lab/cost.js');
const costs = (m, f) => Object.fromEntries(C.cutCosts(L.CASE_YES, L.CASE_NO, m, f).rows.map(r => [r.t, r.cost]));

test('p05#cost table: equal, miss 20x, false YES 5x', () => {
  assert.deepEqual(costs(1, 1), { 6: 60, 5: 39, 4: 33, 3: 58, 2: 92, 1: 140 });
  assert.deepEqual(costs(20, 1), { 6: 1200, 5: 647, 4: 261, 3: 172, 2: 130, 1: 140 });
  assert.deepEqual(costs(1, 5), { 6: 60, 5: 67, 4: 117, 3: 266, 2: 452, 1: 700 });
  assert.equal(C.cutCosts(L.CASE_YES, L.CASE_NO, 1, 1).best.t, 4);
  assert.equal(C.cutCosts(L.CASE_YES, L.CASE_NO, 20, 1).best.t, 2);
  assert.equal(C.cutCosts(L.CASE_YES, L.CASE_NO, 1, 5).best.t, 5);
  assert.equal(C.cutCosts(L.CASE_YES, L.CASE_NO, 1, 5).never.cost, 60); // never YES would be cheaper still
});
test('J assumes a miss costs 140/60 = 2.33 false YESes', () => {
  assert.ok(Math.abs(C.jImpliedRatio(60, 140) - 2.333) < 1e-3);
});
