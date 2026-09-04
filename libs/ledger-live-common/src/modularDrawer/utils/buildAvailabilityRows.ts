export type AvailabilityRow<T> = { kind: "item"; item: T } | { kind: "unavailableSectionHeader" };

/**
 * Lays out selection rows as a single list where the items that are not available yet sit behind a
 * section header, keeping the incoming order within each group. The header is omitted when every
 * item is available.
 */
export function buildAvailabilityRows<T>(
  items: readonly T[],
  isUnavailable: (item: T) => boolean,
): AvailabilityRow<T>[] {
  const available: AvailabilityRow<T>[] = [];
  const unavailable: AvailabilityRow<T>[] = [];

  for (const item of items) {
    const rows = isUnavailable(item) ? unavailable : available;
    rows.push({ kind: "item", item });
  }

  if (unavailable.length === 0) return available;

  return [...available, { kind: "unavailableSectionHeader" }, ...unavailable];
}
