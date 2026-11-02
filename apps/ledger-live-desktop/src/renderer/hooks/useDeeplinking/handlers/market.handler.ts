import { DeeplinkHandler } from "../types";
import { parseMarketListCategory } from "@ledgerhq/live-common/market/utils/category";
import { setMarketCategory } from "~/renderer/actions/market";
import { navigateLedgerAssetDeeplink } from "./navigateLedgerAssetDeeplink";

/**
 * Market deeplinks. `/market/:currencyId` opens the coin detail and
 * `/market/:currencyId/...tokenPath` opens the token detail using its Ledger id.
 * Unresolvable paths fall back to the market list.
 *
 * A `?category=` param pre-selects the Market category before navigating; unknown values
 * fall back to `all`.
 */
export const marketHandler: DeeplinkHandler<"market"> = (route, { navigate, dispatch }) => {
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
    navigate,
    fallbackPath: "/market",
  });
};
