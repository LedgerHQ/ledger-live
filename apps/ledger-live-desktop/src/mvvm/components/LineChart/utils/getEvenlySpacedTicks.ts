/**
 * Returns evenly spaced data indices (always including the first and last point)
 * so the x-axis renders at least `minTicks` labels when enough data is available.
 */
export function getEvenlySpacedTicks(length: number, minTicks: number): number[] {
  if (length <= 0) return [];
  const effectiveMinTicks = Math.max(2, minTicks);
  if (length <= effectiveMinTicks) return Array.from({ length }, (_, index) => index);

  const ticks = Array.from({ length: effectiveMinTicks }, (_, index) =>
    Math.round((index * (length - 1)) / (effectiveMinTicks - 1)),
  );
  return Array.from(new Set(ticks));
}
