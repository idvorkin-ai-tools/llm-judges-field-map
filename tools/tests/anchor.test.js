// node --test tools/   — p06 anchoring figure.
const test = require('node:test');
const assert = require('node:assert');
const L = require('../../lab/anchor.js');
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

test('anchoring figure (p06#anchoring): prior 2 gives 3, prior 5 gives 4', () => {
  near(L.anchored(3.5, 2, 1 / 3), 3);
  near(L.anchored(3.5, 5, 1 / 3), 4);
  near(L.anchored(3.5, 5, 0), 3.5);
  near(L.anchored(3.5, 5, 1), 5);
});
