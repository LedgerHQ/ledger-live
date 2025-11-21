import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import perFamilyShouldUseReceiveOptions from "~/generated/ShouldUseReceiveOptions";

export type NoahParams = {
  fromMenu?: boolean;
  currency?: string | CryptoOrTokenCurrency;
};

export function shouldShowNoahMenu(params: NoahParams, noahFlagEnabled: boolean) {
  const fromMenu = params.fromMenu;
  const currency = params.currency;
  let hasValidCurrency = true;

  if (currency) {
    // @ts-expect-error issue in typing
    const decoraters = perFamilyShouldUseReceiveOptions[getCurrencyFamily(currency)];
    hasValidCurrency = decoraters?.(getCurrencyId(currency)) ?? false;
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

function getCurrencyFamily(currency: string | CryptoOrTokenCurrency) {
  if (typeof currency === "string") {
    return currency;
  }
  return currency.type === "TokenCurrency" ? currency.parentCurrency.family : currency.family;
}
