// node --test tools/  — p09#one-case: the judge shrinks a gap without flipping it.
const test = require('node:test');
const assert = require('node:assert');
const A = require('../../lab/attenuation.js');
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('casebook judge on systems A and B (p09)', () => {
  const mA = A.measured(0.60, 0.80, 0.85), mB = A.measured(0.50, 0.80, 0.85);
  near(mA, 0.54); near(mB, 0.475);
  near(mA - mB, 0.065); // 10 points -> 6.5
  near(A.measured(0.3, 0.8, 0.85), 0.15 + 0.65 * 0.3); // the straight line 0.15 + 0.65 t
  const g = A.gapZ(mA, mB, 500, 500);
  near(g.z, 2.06, 0.01); // "about two standard errors"
});

test('Rogan-Gladen recovers the true rate', () => {
  near(A.roganGladen(0.54, 0.80, 0.85), 0.60);
  near(A.roganGladen(0.475, 0.80, 0.85), 0.50);
  assert.equal(A.roganGladen(0.5, 0.5, 0.5), null); // J = 0: judge carries no information
});
