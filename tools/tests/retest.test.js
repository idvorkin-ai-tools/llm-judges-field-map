// node --test tools/  — maths behind the p01 retest widget.
const test = require('node:test');
const assert = require('node:assert');
const L = Object.assign({}, require('../../lab.js'), require('../../lab/retest.js'));
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('retest: no bias, no noise is perfect (p01)', () => {
  const r = L.retest(0, 0);
  near(r.accuracy, 1); near(r.selfAgree, 1); near(r.ceiling, 1);
});
test('retest: bias lowers accuracy but not self-agreement (p01)', () => {
  const r = L.retest(0.3, 0);
  near(r.accuracy, 0.7); near(r.selfAgree, 1);
});
test('retest: pure noise makes accuracy hit the ceiling (p01)', () => {
  const r = L.retest(0, 0.6);
  near(r.accuracy, 0.7); near(r.selfAgree, 0.58); near(r.ceiling, 0.7);
  const all = L.retest(0, 1);
  near(all.accuracy, 0.5); near(all.selfAgree, 0.5); near(all.ceiling, 0.5);
});
test('retest: accuracy never exceeds the ceiling', () => {
  for (let b = 0; b <= 0.5; b += 0.05) for (let f = 0; f <= 1; f += 0.05) {
    const r = L.retest(b, f);
    assert.ok(r.accuracy <= r.ceiling + 1e-12, `b=${b} f=${f}`);
  }
  assert.equal(L.retestCeiling(0.4), null);
});

