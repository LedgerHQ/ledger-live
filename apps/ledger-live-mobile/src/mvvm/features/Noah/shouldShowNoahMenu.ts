import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type NoahParams = {
  fromMenu?: boolean;
  currency?: string | CryptoOrTokenCurrency;
};

export function shouldShowNoahMenu(
  params: NoahParams,
  noahFlagEnabled: boolean,
  activeCurrencyIds: string[],
) {
  const fromMenu = params.fromMenu;
  const currency = params.currency;
  let hasValidCurrency = true;

  if (currency) {
    hasValidCurrency = activeCurrencyIds.includes(getCurrencyId(currency));
  }

  // Don't show the Noah menu
  if (!noahFlagEnabled || !hasValidCurrency || fromMenu) {
    return false;
  }

  return true;
}

function getCurrencyId(currency: string | CryptoOrTokenCurrency) {
  if (typeof currency === "string") {
    return currency;
  }
  return currency.id;
}
