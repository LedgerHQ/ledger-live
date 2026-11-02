import type { AccountPortfolioView, PortfolioAssetView } from "../types";

const assetText = (asset: PortfolioAssetView) => [
  asset.network,
  asset.asset,
  asset.ticker,
  asset.name,
  asset.calId,
];

const matches = (fields: readonly (string | undefined)[], words: readonly string[]) => {
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return words.every(word => haystack.includes(word));
};

/** Whether this kind of result has lines worth searching. */
export const isSearchable = (view: AccountPortfolioView | undefined): boolean =>
  view?.kind === "balance" || view?.kind === "history" || view?.kind === "updates";

/**
 * The lines of the view that contain every word typed, in the network, asset, ticker, name,
 * account or hash, whatever the case; and how many it left out. An empty search leaves the view as it is.
 */
export function filterByText(
  view: AccountPortfolioView,
  query: string,
): { readonly view: AccountPortfolioView; readonly hidden: number } {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { view, hidden: 0 };

  if (view.kind === "balance") {
    const entries = view.entries.filter(e => matches([...assetText(e), e.accountId], words));
    return { view: { ...view, entries }, hidden: view.entries.length - entries.length };
  }
  if (view.kind === "history") {
    const points = view.points.filter(p => matches([...assetText(p), p.accountId], words));
    return { view: { ...view, points }, hidden: view.points.length - points.length };
  }
  if (view.kind === "updates") {
    const operations = view.operations.filter(operation =>
      matches(
        [
          operation.network,
          operation.accountId,
          operation.hash,
          ...operation.deltas.flatMap(assetText),
        ],
        words,
      ),
    );
    return { view: { ...view, operations }, hidden: view.operations.length - operations.length };
  }
  return { view, hidden: 0 };
}
