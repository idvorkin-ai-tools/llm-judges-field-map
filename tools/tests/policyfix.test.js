// node --test tools/  — maths behind the p02 policyfix widget.
const test = require('node:test');
const assert = require('node:assert');
const L = Object.assign({}, require('../../lab.js'), require('../../lab/policyfix.js'));
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('policyFix: nothing settled is the casebook 75% / 0.49 (p02)', () => {
  const v = L.policyFix(45, 15, 10, 30, 0, 0.5);
  assert.deepStrictEqual(v, [45, 15, 10, 30]);
  const r = L.agreement(...v);
  near(r.po, 0.75); near(r.kappa, 0.4898);
});
test('policyFix: settling 20 of 25 leaves 5 slips (p02)', () => {
  const v = L.policyFix(45, 15, 10, 30, 20, 0.5);
  near(v[1], 3); near(v[2], 2); near(v[0], 55); near(v[3], 40);
  const r = L.agreement(...v);
  near(r.po, 0.95); near(r.kappa, 0.8977);
});
test('policyFix: settling all splits gives kappa 1 (p02)', () => {
  const r = L.agreement(...L.policyFix(45, 15, 10, 30, 25, 0.6));
  near(r.po, 1); near(r.kappa, 1);
});

