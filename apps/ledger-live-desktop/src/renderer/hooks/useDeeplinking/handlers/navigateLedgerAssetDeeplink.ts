import { parseLedgerAssetPath } from "@ledgerhq/asset-detail";
import { getAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { NavigateFn } from "../types";

type NavigateLedgerAssetDeeplinkParams = {
  path: string;
  navigate: NavigateFn;
  /** Where to land when the path can't be resolved to a Ledger asset. */
  fallbackPath: string;
};

/**
 * Shared routing for `market` and `asset` deeplinks. Parses the path into a Ledger coin or token id
 * and opens Asset Detail. Token paths carry their `ledgerIds` into that screen.
 */
export function navigateLedgerAssetDeeplink({
  path,
  navigate,
  fallbackPath,
}: NavigateLedgerAssetDeeplinkParams): void {
  const assetPath = parseLedgerAssetPath(path);

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
}
