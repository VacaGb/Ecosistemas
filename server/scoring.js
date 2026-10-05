const POINTS_PER_SECOND = 10;

function calculatePoints(basePoints, survived, elapsedMs) {
  // A missing answer earns nothing, including no survival bonus.
  if (elapsedMs === null) return { points: 0, timePenalty: 0 };
  const available = basePoints + (survived ? 50 : 0);
  const timePenalty = Math.min(available, Math.floor(Math.max(0, elapsedMs) / 1000) * POINTS_PER_SECOND);
  return { points: available - timePenalty, timePenalty };
}

module.exports = { POINTS_PER_SECOND, calculatePoints };
