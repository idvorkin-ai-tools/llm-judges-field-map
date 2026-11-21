// node --test tools/   — p07 Goodhart curves.
const test = require('node:test');
const assert = require('node:assert');
const L = require('../../lab/goodhart.js');
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('Goodhart: gold peaks at alpha / 2 beta and returns to 0 at twice that', () => {
  const pk = L.goodhartPeak(1, 0.1);
  near(pk.d, 5); near(pk.gold, 2.5);
  near(L.goodhart(5, 1, 0.1).gold, 2.5);
  near(L.goodhart(10, 1, 0.1).gold, 0);
  assert.ok(L.goodhart(10, 1, 0.1).proxy > L.goodhart(5, 1, 0.1).proxy);
  assert.ok(L.goodhart(4, 1, 0.1).gold < pk.gold && L.goodhart(6, 1, 0.1).gold < pk.gold);
  assert.equal(L.goodhartPeak(1, 0), null);
});
