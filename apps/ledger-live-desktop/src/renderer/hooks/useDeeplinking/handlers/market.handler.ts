import { DeeplinkHandler } from "../types";
import { getMarketOrAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { parseMarketListCategory } from "@ledgerhq/live-common/market/utils/category";
import { setMarketCategory } from "~/renderer/actions/market";
import { navigateLedgerAssetDeeplink } from "./navigateLedgerAssetDeeplink";

/**
 * Market deeplinks. When Wallet 4.0 aggregated assets is on, `/market/:currencyId` opens the
 * coin detail and `/market/:currencyId/...tokenPath` opens the token detail using its Ledger id.
 * When off, only coin ids are supported and invalid paths fall back to the market list.
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

  navigateLedgerAssetDeeplink({
    path,
    assetsPath,
    navigate,
    fallbackPath: "/market",
    legacyDetailPath: currencyId => getMarketOrAssetDetailPath(currencyId, false),
  });
};
