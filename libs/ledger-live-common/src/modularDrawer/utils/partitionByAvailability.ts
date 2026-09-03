export type AvailabilityPartition<T> = {
  available: T[];
  unavailable: T[];
};

/**
 * Splits selection rows into the ones the user can pick and the ones that are not available yet,
 * keeping the incoming order within each group so callers can render them as two sections.
 */
export function partitionByAvailability<T>(
  items: readonly T[],
  isUnavailable: (item: T) => boolean,
): AvailabilityPartition<T> {
  const available: T[] = [];
  const unavailable: T[] = [];

  for (const item of items) {
    if (isUnavailable(item)) {
      unavailable.push(item);
    } else {
      available.push(item);
    }
  }

  return { available, unavailable };
}
