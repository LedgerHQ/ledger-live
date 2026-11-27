/** Returns the coin-config override when it is an integer of at least `min`, otherwise the default. */
export function tuning(value: unknown, fallback: number, min = 0): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min ? value : fallback;
}
