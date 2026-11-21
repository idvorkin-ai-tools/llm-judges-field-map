// node --test tools/   — p06 swap test.
const test = require('node:test');
const assert = require('node:assert');
const L = require('../../lab/swap.js');
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('casebook swap test (p06#position): 62 / 30 / 8', () => {
  const r = L.swapTest(100, 30, 8, 0.5);
  assert.equal(r.consistent, 62); assert.equal(r.flips, 38);
  near(r.swapRate, 0.38); near(r.firstShare, 30 / 38); near(r.firstShare, 0.789);
  assert.equal(r.swing, 22);
  near(r.single.x, 61); near(r.single.rival, 39);
  near(r.both.x, 31); near(r.both.rival, 31); assert.equal(r.both.ties, 38);
});

test('Zheng et al. GPT-4 split (65 / 30 / 5)', () => {
  const r = L.swapTest(100, 30, 5, 0.5);
  assert.equal(r.consistent, 65); assert.equal(r.swing, 25);
});

test('no flips: both orders change nothing; first share undefined', () => {
  const r = L.swapTest(100, 0, 0, 0.7);
  assert.equal(r.firstShare, null);
  near(r.single.x, r.both.x); near(r.single.x, 70);
});
