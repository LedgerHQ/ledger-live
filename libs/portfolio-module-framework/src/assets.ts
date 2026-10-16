import type { ChainAssetView } from "./types";

/**
 * How the service keys an asset (`BalanceEntry.asset`, `TransactionIntentView.asset`): its
 * reference (contract address, token id...) when it has one, "native" for the native asset, its
 * type otherwise. The reference comes first: Cardano tokens have the type "native".
 */
export const assetKeyOf = (asset: ChainAssetView): string =>
  asset.assetReference || (asset.type === "native" ? "native" : asset.type);
