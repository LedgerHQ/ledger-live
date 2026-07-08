import { parseLedgerAssetPath } from "@ledgerhq/asset-detail";
import { getAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { NavigateFn } from "../types";

type NavigateLedgerAssetDeeplinkParams = {
  path: string;
  assetsPath: "/asset" | "/market";
  navigate: NavigateFn;
  /** Where to land when the path can't be resolved to a Ledger asset. */
  fallbackPath: string;
  /** Legacy (Wallet 4.0 off) destination for a resolved coin id. */
  legacyDetailPath: (currencyId: string) => string;
};

/**
 * Shared routing for `market` and `asset` deeplinks. Parses the path into a Ledger coin or token id
 * and navigates accordingly. When Wallet 4.0 aggregated assets is on, token paths carry their
 * `ledgerIds` market state into Asset Detail; when off, only coin ids are supported and everything
 * else falls back to `fallbackPath`.
 */
export function navigateLedgerAssetDeeplink({
  path,
  assetsPath,
  navigate,
  fallbackPath,
  legacyDetailPath,
}: NavigateLedgerAssetDeeplinkParams): void {
  const assetPath = parseLedgerAssetPath(path);

  if (assetsPath === "/asset") {
    if (!assetPath) {
      navigate(fallbackPath);
      return;
    }

    if (assetPath.ledgerIds) {
      navigate(getAssetDetailPath(assetPath.assetId), {
        id: assetPath.assetId,
        ledgerIds: assetPath.ledgerIds,
      });
      return;
    }

    navigate(getAssetDetailPath(assetPath.assetId));
    return;
  }

  const currencyId = assetPath?.ledgerIds ? null : assetPath?.currencyId;
  if (currencyId) {
    navigate(legacyDetailPath(currencyId));
    return;
  }

  navigate(fallbackPath);
}
