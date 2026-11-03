import type { AnalyticsCatalog, AnalyticsPosition, AnalyticsSelection } from "../types";

export function selectAnalyticsPositions(
  catalog: AnalyticsCatalog,
  selection: AnalyticsSelection,
): readonly AnalyticsPosition[] {
  return catalog.positions.filter(
    position =>
      (selection.assetId === null || position.assetId === selection.assetId) &&
      (selection.assetId === null ||
        selection.accountId === null ||
        position.accountId === selection.accountId),
  );
}

export function selectAnalyticsAccounts(catalog: AnalyticsCatalog, assetId: string | null) {
  if (assetId === null) return [];
  const accountIds = new Set(
    catalog.positions
      .filter(position => position.assetId === assetId)
      .map(position => position.accountId),
  );
  return catalog.accounts.filter(account => accountIds.has(account.id));
}
