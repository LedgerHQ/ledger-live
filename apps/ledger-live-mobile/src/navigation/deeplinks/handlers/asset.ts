import { getStateFromPath } from "@react-navigation/native";
import { validateMarketCurrencyId } from "../validation";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://asset/:currencyId`
 *
 * Validates the currencyId path param and redirects to portfolio on failure.
 */
export const assetHandler: DeeplinkHandler = ({ url, pathname }, { config }) => {
  const currencyIdFromPath = pathname.replace("/", "");

  if (currencyIdFromPath) {
    const validatedCurrencyId = validateMarketCurrencyId(currencyIdFromPath);

    if (!validatedCurrencyId) {
      return getStateFromPath("portfolio", config);
    }

    url.pathname = `/${validatedCurrencyId}`;
    return getStateFromPath(url.href?.split("://")[1], config);
  }

  return getStateFromPath("portfolio", config);
};
