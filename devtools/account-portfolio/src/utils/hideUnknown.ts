import type { AccountPortfolioView, PortfolioAssetView } from "../types";

/** An asset CAL has an id for: the service gave one, or CAL named it from its contract address. */
const isKnown = (asset: PortfolioAssetView) => asset.calId !== undefined;

/**
 * The view without the assets that have no ledger id, and how many entries that hid. An operation
 * is hidden when all of its balance changes are on unknown assets; one that changed no balance
 * (a failed transaction, say) is kept. The accounts the service could not read stay: they are not
 * assets.
 */
export function hideUnknownTokens(view: AccountPortfolioView): {
  readonly view: AccountPortfolioView;
  readonly hidden: number;
} {
  if (view.kind === "balance") {
    const entries = view.entries.filter(isKnown);
    return { view: { ...view, entries }, hidden: view.entries.length - entries.length };
  }
  if (view.kind === "history") {
    const points = view.points.filter(isKnown);
    return { view: { ...view, points }, hidden: view.points.length - points.length };
  }
  if (view.kind === "updates") {
    const operations = view.operations
      .map(operation => ({ ...operation, deltas: operation.deltas.filter(isKnown) }))
      .filter((operation, index) => {
        const hadDeltas = view.operations[index].deltas.length > 0;
        return !hadDeltas || operation.deltas.length > 0;
      });
    return { view: { ...view, operations }, hidden: view.operations.length - operations.length };
  }
  return { view, hidden: 0 };
}
