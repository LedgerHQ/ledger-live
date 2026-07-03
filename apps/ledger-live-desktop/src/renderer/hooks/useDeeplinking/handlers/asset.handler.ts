import { DeeplinkHandler } from "../types";
import { getAssetDetailPath, parseLedgerAssetPath } from "LLD/utils/marketAssetNavigation";

/**
 * Asset deeplinks. Empty path → portfolio (`/`). When Wallet 4.0 is on, `/asset/:currencyId`
 * opens the coin detail and `/asset/:currencyId/...tokenPath` opens the token detail using its
 * Ledger id. When off, only coin ids are supported and invalid paths fall back to portfolio.
 */
export const assetHandler: DeeplinkHandler<"asset"> = (route, { navigate, assetsPath }) => {
  const path = route.path.trim();

  if (!path) {
    navigate("/");
    return;
  }

  const assetPath = parseLedgerAssetPath(path);

  if (assetsPath === "/asset") {
    if (!assetPath) {
      navigate("/");
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
    navigate(getAssetDetailPath(currencyId));
    return;
  }

  navigate("/");
};
