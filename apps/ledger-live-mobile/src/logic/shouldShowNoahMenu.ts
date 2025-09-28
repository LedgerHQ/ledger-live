import { RouteProp } from "@react-navigation/core";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import perFamilyShouldUseReceiveOptions from "~/generated/ShouldUseReceiveOptions";

export type NoahRouteProp = RouteProp<{
  params: {
    params?: {
      fromMenu?: boolean;
      currency?: string | CryptoCurrency | TokenCurrency | undefined;
    };
  };
}>;

export function shouldShowNoahMenu(route: NoahRouteProp, noahFlagEnabled: boolean) {
  const { params } = route.params ?? {};
  const fromMenu = params?.fromMenu;
  const currency = params?.currency;
  let hasValidCurrency = true;

  if (currency) {
    // @ts-expect-error issue in typing
    const decoraters = perFamilyShouldUseReceiveOptions[getCurrencyFamily(currency)];
    hasValidCurrency = decoraters?.(getCurrencyId(currency)) ?? false;
  }

  // Show the original configuration in the stack
  if (!noahFlagEnabled || !hasValidCurrency || fromMenu || !route.params) {
    return false;
  }

  return true;
}

function getCurrencyId(currency: string | CryptoCurrency | TokenCurrency) {
  if (typeof currency === "string") {
    return currency;
  }
  return currency.id;
}

function getCurrencyFamily(currency: string | CryptoCurrency | TokenCurrency) {
  if (typeof currency === "string") {
    return currency;
  }
  return currency.type === "TokenCurrency" ? currency.parentCurrency.family : currency.family;
}
