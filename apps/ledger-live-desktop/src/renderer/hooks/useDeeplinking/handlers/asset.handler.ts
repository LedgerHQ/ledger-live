import { DeeplinkHandler } from "../types";
import { getAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { navigateLedgerAssetDeeplink } from "./navigateLedgerAssetDeeplink";

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

  navigateLedgerAssetDeeplink({
    path,
    assetsPath,
    navigate,
    fallbackPath: "/",
    legacyDetailPath: getAssetDetailPath,
  });
};
