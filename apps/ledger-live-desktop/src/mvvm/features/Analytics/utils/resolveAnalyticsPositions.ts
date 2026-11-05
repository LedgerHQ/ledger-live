import type { AccountLike } from "@ledgerhq/types-live";

export function resolveAnalyticsPositions(
  positionIds: readonly string[],
  positions: readonly AccountLike[],
): AccountLike[] | undefined {
  const byId = new Map(positions.map(position => [position.id, position]));
  const selected: AccountLike[] = [];
  for (const id of positionIds) {
    const position = byId.get(id);
    if (!position) return undefined;
    selected.push(position);
  }
  return selected;
}
