import { useMemo } from "react";
import { AvailabilityRow, buildAvailabilityRows } from "../utils/buildAvailabilityRows";

export function useAvailabilityRows<T>(
  items: readonly T[],
  isUnavailable: (item: T) => boolean,
): AvailabilityRow<T>[] {
  return useMemo(() => buildAvailabilityRows(items, isUnavailable), [items, isUnavailable]);
}
