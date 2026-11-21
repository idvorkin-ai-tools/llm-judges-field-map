// node --test tools/  — maths behind the p03 bradley-terry widget.
const test = require('node:test');
const assert = require('node:assert');
const L = Object.assign({}, require('../../lab.js'), require('../../lab/bradley-terry.js'));
const near = (got, want, tol = 5e-4) => assert.ok(Math.abs(got - want) <= tol, `got ${got}, want ${want}`);

const FIG = [ // p03 figure: A-B 6-4, A-C 7-3, A-D 8-2, B-C 6-4, B-D 4-6, C-D 6-4
  [0, 6, 7, 8],
  [4, 0, 6, 4],
  [3, 4, 0, 6],
  [2, 6, 4, 0]
];
test('Bradley-Terry reproduces the p03 figure ratings', () => {
  const r = L.btFit(FIG);
  near(Math.round(r[0]), 1111, 0); near(Math.round(r[1]), 981, 0);
  near(Math.round(r[2]), 963, 0); near(Math.round(r[3]), 945, 0);
  near(r.reduce((a, b) => a + b, 0) / 4, 1000, 1e-9);
});
test('Bradley-Terry win probabilities in the p03 caption', () => {
  const r = L.btFit(FIG);
  assert.equal(Math.round(100 * L.btWinProb(r[0], r[3])), 72);
  assert.equal(Math.round(100 * L.btWinProb(r[1], r[2])), 53);
  near(L.btWinProb(1400, 1000), 10 / 11, 1e-12); // 400 points = ten-to-one odds
});
test('Bradley-Terry has no fit when a contender never wins or never loses', () => {
  const sweep = FIG.map(r => r.slice()); sweep[0] = [0, 10, 10, 10]; sweep[1][0] = 0; sweep[2][0] = 0; sweep[3][0] = 0;
  assert.equal(L.btFit(sweep), null);
  const shut = FIG.map(r => r.slice()); shut[3] = [0, 0, 0, 0]; shut[0][3] = 10; shut[1][3] = 10; shut[2][3] = 10;
  assert.equal(L.btFit(shut), null);
});
test('Bradley-Terry: equal records give equal ratings', () => {
  const r = L.btFit([[0, 5, 5], [5, 0, 5], [5, 5, 0]]);
  r.forEach(x => near(x, 1000, 1e-9));
});
