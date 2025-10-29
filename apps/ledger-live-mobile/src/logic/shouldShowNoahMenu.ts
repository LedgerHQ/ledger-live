import { NavigationRoute } from "@react-navigation/core";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import perFamilyShouldUseReceiveOptions from "~/generated/ShouldUseReceiveOptions";

export type NoahRouteProp = NavigationRoute<
  {
    params: {
      params?: {
        fromMenu?: boolean;
        currency?: string | CryptoCurrency | TokenCurrency;
      };
    };
  },
  "params"
>;

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

  if (route.params) {
    return noahFlagEnabled && hasValidCurrency && !fromMenu;
  }

  // If route.params is undefined, check if we're in a nested navigation state. This
  // happens when navigating from `ReceiveSelectCrypto` to `ReceiveProvider`. In this
  // case, keep the modal presentation stable by checking the navigation state
  return !!(route.state && noahFlagEnabled);
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
