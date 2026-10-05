const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculatePoints } = require('../server/scoring');

test('time scoring honors complete-second boundaries, zero floor, and missing answers', () => {
  assert.deepEqual(calculatePoints(300, true, 0), { points: 350, timePenalty: 0 });
  assert.deepEqual(calculatePoints(300, true, 999), { points: 350, timePenalty: 0 });
  assert.deepEqual(calculatePoints(300, true, 1000), { points: 340, timePenalty: 10 });
  assert.deepEqual(calculatePoints(300, true, 5000), { points: 300, timePenalty: 50 });
  assert.deepEqual(calculatePoints(300, true, 20000), { points: 150, timePenalty: 200 });
  assert.deepEqual(calculatePoints(300, true, 29999), { points: 60, timePenalty: 290 });
  assert.deepEqual(calculatePoints(50, true, 20000), { points: 0, timePenalty: 100 });
  assert.deepEqual(calculatePoints(300, false, 5000), { points: 250, timePenalty: 50 });
  assert.deepEqual(calculatePoints(0, false, 1000), { points: 0, timePenalty: 0 });
  assert.deepEqual(calculatePoints(0, true, null), { points: 0, timePenalty: 0 });
  assert.deepEqual(calculatePoints(0, false, null), { points: 0, timePenalty: 0 });
});
