import { DeeplinkHandler } from "../types";
import { navigateLedgerAssetDeeplink } from "./navigateLedgerAssetDeeplink";

/**
 * Asset deeplinks. Empty path → portfolio (`/`). `/asset/:currencyId` opens the coin detail
 * and `/asset/:currencyId/...tokenPath` opens the token detail using its Ledger id.
 * Unresolvable paths fall back to portfolio.
 */
export const assetHandler: DeeplinkHandler<"asset"> = (route, { navigate }) => {
  const path = route.path.trim();

  if (!path) {
    navigate("/");
    return;
  }

  navigateLedgerAssetDeeplink({
    path,
    navigate,
    fallbackPath: "/",
  });
};
