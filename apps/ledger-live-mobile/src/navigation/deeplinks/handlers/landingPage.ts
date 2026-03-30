import { getStateFromPath } from "@react-navigation/native";
import { validateLargeMoverCurrencyIds, validateLargeMoverLedgerIds } from "../validation";
import type { DeeplinkHandler } from "../types";

/**
 * Handles `ledgerlive://landing-page-large-mover`
 *
 * Validates ledgerIds / currencyIds params and redirects to market on failure.
 */
export const landingPageHandler: DeeplinkHandler = ({ url, searchParams }, { config }) => {
  const validatedLedgerIds = validateLargeMoverLedgerIds(searchParams.get("ledgerIds"));
  const validatedCurrencyIds = validateLargeMoverCurrencyIds(searchParams.get("currencyIds"));

  if (validatedLedgerIds) {
    url.searchParams.set("currencyIds", "");
    url.searchParams.set("ledgerIds", validatedLedgerIds);
  } else if (validatedCurrencyIds) {
    url.searchParams.delete("ledgerIds");
    url.searchParams.set("currencyIds", validatedCurrencyIds);
  } else {
    return getStateFromPath("market", config);
  }

  return getStateFromPath(url.href?.split("://")[1], config);
};
