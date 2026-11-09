import type { AnalyticsCatalog, AnalyticsInitialSelection, AnalyticsSelection } from "../../types";

export const DEFAULT_ANALYTICS_SELECTION: AnalyticsSelection = {
  assetId: null,
  accountId: null,
  metric: "balance",
};

export function resolveAnalyticsSelection(
  selection: AnalyticsSelection,
  catalog: AnalyticsCatalog,
): AnalyticsSelection {
  const assetExists =
    selection.assetId !== null &&
    catalog.assets.some(asset => asset.id === selection.assetId) &&
    catalog.positions.some(position => position.assetId === selection.assetId);
  if (!assetExists) {
    return selection.assetId === null && selection.accountId === null
      ? selection
      : { ...selection, assetId: null, accountId: null };
  }
  const accountExists =
    selection.accountId === null ||
    (catalog.accounts.some(account => account.id === selection.accountId) &&
      catalog.positions.some(
        position =>
          position.assetId === selection.assetId && position.accountId === selection.accountId,
      ));
  return accountExists ? selection : { ...selection, accountId: null };
}

export function resolveInitialAnalyticsSelection(
  initialSelection: AnalyticsInitialSelection | undefined,
  catalog: AnalyticsCatalog,
): AnalyticsSelection {
  const position = initialSelection
    ? catalog.positions.find(
        candidate =>
          candidate.currencyId === initialSelection.currencyId &&
          candidate.accountId === initialSelection.accountId,
      )
    : undefined;
  return position
    ? resolveAnalyticsSelection(
        { assetId: position.assetId, accountId: position.accountId, metric: "balance" },
        catalog,
      )
    : DEFAULT_ANALYTICS_SELECTION;
}
