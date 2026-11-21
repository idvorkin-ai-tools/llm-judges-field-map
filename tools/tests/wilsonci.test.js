// node --test tools/  — p08 error bars and math.html#ci / #sample-size.
const test = require('node:test');
const assert = require('node:assert');
const C = require('../../lab/wilsonci.js');
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('Wilson intervals printed on p08 and math#ci', () => {
  let w = C.wilson(48, 60); near(w.lo, 0.682); near(w.hi, 0.882); near(w.centre, 0.78195); near(w.half, 0.09977);
  w = C.wilson(119, 140); near(w.lo, 0.782); near(w.hi, 0.900);
  w = C.wilson(75, 100); near(w.lo, 0.657); near(w.hi, 0.825);
  // p08 figure: 80% from 50 and from 500 items
  w = C.wilson(40, 50); near(w.lo, 0.67, 5e-3); near(w.hi, 0.89, 5e-3);
  w = C.wilson(400, 500); near(w.lo, 0.76, 5e-3); near(w.hi, 0.83, 5e-3);
});

test('Wald interval for 48/60 (math#ci aside)', () => {
  const w = C.wald(48, 60); near(w.lo, 0.699); near(w.hi, 0.901);
});

test('normal-approximation half-widths near 0.8 (p08)', () => {
  near(C.wald(40, 50).half, 0.11, 5e-3);
  near(C.wald(80, 100).half, 0.078, 5e-4);
  near(C.wald(320, 400).half, 0.039, 5e-4);
});

test('sample sizes (p08, math#sample-size)', () => {
  // the pages round up to whole items
  const up = (p, h) => Math.ceil(C.nForHalfWidth(p, h));
  near(C.nForHalfWidth(0.8, 0.10), 61.5, 0.1);
  assert.equal(up(0.8, 0.10), 62); assert.equal(up(0.8, 0.05), 246);
  assert.equal(up(0.8, 0.03), 683); assert.equal(up(0.5, 0.05), 385);
  assert.equal(C.nForHalfWidth(0.8, 0), null);
});

test('degenerate inputs', () => {
  assert.equal(C.wilson(0, 0), null);
  const w = C.wilson(0, 20); near(w.lo, 0); assert.ok(w.hi > 0.1); // Wilson stays inside [0,1]
  assert.ok(C.wald(0, 20).half === 0); // Wald collapses to a point: why not to use it
});
