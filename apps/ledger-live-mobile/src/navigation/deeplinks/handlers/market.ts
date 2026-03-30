import { getStateFromPath } from "@react-navigation/native";
import { validateMarketCurrencyId } from "../validation";
import { handleMarketBannerDeeplink } from "../handleMarketBannerDeeplink";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://market` and `ledgerlive://market/:currencyId`
 *
 * - Validates the currencyId path param and redirects to /market on failure.
 * - When no currencyId and the market banner feature is active, uses the banner deeplink state.
 */
export const marketHandler: DeeplinkHandler = (
  { url, pathname },
  { config, shouldDisplayMarketBanner },
) => {
  const currencyIdFromPath = pathname.replace("/", "");

  if (currencyIdFromPath) {
    const validatedCurrencyId = validateMarketCurrencyId(currencyIdFromPath);

    if (!validatedCurrencyId) {
      return getStateFromPath("market", config);
    }

    url.pathname = `/${validatedCurrencyId}`;
    return getStateFromPath(url.href?.split("://")[1], config);
  }

  if (shouldDisplayMarketBanner) {
    return handleMarketBannerDeeplink();
  }

  return getStateFromPath("market", config);
};
