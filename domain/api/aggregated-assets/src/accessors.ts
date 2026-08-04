import { collectAllByCategory } from "./internals/collectAllByCategory";
import type { GetAssetsByCategoryParams } from "./types";

/** Every ticker in a category, across all pages. */
export function fetchAllAssetsByCategory(queryArg: GetAssetsByCategoryParams) {
  return collectAllByCategory(queryArg, data =>
    Object.values(data.cryptoAssets).map(a => a.ticker),
  );
}

/** Every per-network currency id in a category, across all pages. */
export function fetchAllAssetCurrencyIdsByCategory(queryArg: GetAssetsByCategoryParams) {
  return collectAllByCategory(queryArg, data =>
    Object.values(data.cryptoAssets).flatMap(meta => Object.values(meta.assetsIds)),
  );
}
