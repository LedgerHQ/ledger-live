import { DeeplinkHandler } from "../types";
import { getAssetDetailPath, resolveLegacyCryptoCurrencyId } from "LLD/utils/marketAssetNavigation";

/**
 * Asset deeplinks. Empty path → portfolio (`/`). When Wallet 4.0 is on, passes the raw path to
 * Asset Detail; when off, validates and falls back to portfolio for unknown ids (mobile parity).
 */
export const assetHandler: DeeplinkHandler<"asset"> = (route, { navigate, assetsPath }) => {
  const path = route.path.trim();

  if (!path) {
    navigate("/");
    return;
  }

  if (assetsPath === "/asset") {
    navigate(getAssetDetailPath(path));
    return;
  }

  const currencyId = resolveLegacyCryptoCurrencyId(path);
  if (currencyId) {
    navigate(getAssetDetailPath(currencyId));
    return;
  }

  navigate("/");
};
