import type { ServiceAccountRowView } from "../types";

export function filterServiceAccountRows(
  rows: readonly ServiceAccountRowView[],
  query: string,
): ServiceAccountRowView[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rows];
  return rows.filter(row =>
    [row.name, row.address, row.network, row.id, row.balanceLabel, row.valueLabel, row.error].some(
      value => value?.toLowerCase().includes(needle),
    ),
  );
}
