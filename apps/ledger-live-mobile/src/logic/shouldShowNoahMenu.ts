import { RouteProp } from "@react-navigation/core";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import perFamilyShouldUseReceiveOptions from "~/generated/ShouldUseReceiveOptions";
import { ScreenName } from "~/const";

export type NoahRouteProp = RouteProp<{
  params: {
    params?: {
      fromMenu?: boolean;
      currency?: string | CryptoCurrency | TokenCurrency;
    };
    screen?: string;
  };
}>;

export function shouldShowNoahMenu(route: NoahRouteProp, noahFlagEnabled: boolean) {
  if (!noahFlagEnabled || !route.params) return false;

  // Handle both nested params (from navigator level) and flat params (from screen level)
  const routeParams = route.params ?? {};
  const params = "params" in routeParams && routeParams.params ? routeParams.params : routeParams;
  const fromMenu = "fromMenu" in params ? params.fromMenu : undefined;
  const currency = "currency" in params ? params.currency : undefined;

  // Skip if navigating directly from noah menu
  if (fromMenu) return false;
  // Only allow Noah menu for entry point screens where user chooses receive method
  const targetScreen = "screen" in routeParams ? routeParams.screen : undefined;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  if (targetScreen && !ALLOWED_SCREENS.has(targetScreen as ScreenName)) return false;

  // Check if currency is in the Noah-supported list (opt-in approach)
  if (currency) {
    // @ts-expect-error issue in typing
    const decoraters = perFamilyShouldUseReceiveOptions[getCurrencyFamily(currency)];
    return decoraters?.(getCurrencyId(currency)) ?? false;
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

const ALLOWED_SCREENS = new Set<ScreenName>([
  ScreenName.ReceiveSelectCrypto,
  ScreenName.ReceiveSelectAccount,
  ScreenName.ReceiveProvider,
]);
