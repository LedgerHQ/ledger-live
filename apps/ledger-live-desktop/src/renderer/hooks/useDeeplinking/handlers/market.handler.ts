import { DeeplinkHandler } from "../types";
import {
  getMarketOrAssetDetailPath,
  resolveLegacyCryptoCurrencyId,
} from "LLD/utils/marketAssetNavigation";
import { parseMarketListCategory } from "@ledgerhq/live-common/market/utils/category";
import { setMarketCategory } from "~/renderer/actions/market";

/**
 * Market deeplinks. When Wallet 4.0 aggregated assets is on, navigates with the raw path so
 * Asset Detail can resolve market-api slugs (no `location.state`; unlike in-app Market row clicks).
 * When off, validates the id and falls back to the market list — aligned with mobile (af91289).
 *
 * A `?category=` param pre-selects the Market category before navigating; unknown values
 * fall back to `all`.
 */
export const marketHandler: DeeplinkHandler<"market"> = (
  route,
  { navigate, assetsPath, dispatch },
) => {
  const path = route.path.trim();

  if (route.category !== undefined) {
    dispatch(setMarketCategory(parseMarketListCategory(route.category) ?? "all"));
  }

  if (!path) {
    navigate("/market");
    return;
  }

  if (assetsPath === "/asset") {
    navigate(getMarketOrAssetDetailPath(path, true));
    return;
  }

  const currencyId = resolveLegacyCryptoCurrencyId(path);
  if (currencyId) {
    navigate(getMarketOrAssetDetailPath(currencyId, false));
    return;
  }

  navigate("/market");
};
