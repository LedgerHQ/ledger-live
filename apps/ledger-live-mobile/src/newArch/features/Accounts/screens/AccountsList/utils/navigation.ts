import { TokenCurrency, CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigationProp, NavigationState } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "../../AddAccount/enums";

type NavigationType = Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & {
  getState(): NavigationState | undefined;
};

type NavigateFunctionsType = {
  navigation: NavigationType;
  currency: TokenCurrency | CryptoCurrency | null | undefined;
};

export function navigateToAssetSelection({
  navigation,
  currency,
}: Readonly<NavigateFunctionsType>) {
  navigation.navigate(NavigatorName.AddAccounts, {
    screen: undefined,
    currency,
  });
}

export function navigateToDeviceSelection({
  navigation,
  currency,
}: Readonly<NavigateFunctionsType>) {
  navigation.navigate(NavigatorName.DeviceSelection, {
    screen: ScreenName.SelectDevice,
    params: {
      currency: currency as CryptoCurrency,
      context: AddAccountContexts.AddAccounts,
    },
  });
}

type NavigateToNetworkSelectionType = {
  navigation: NavigationType;
  currency: TokenCurrency | CryptoCurrency;
};

export function navigateToNetworkSelection({
  navigation,
  currency,
}: Readonly<NavigateToNetworkSelectionType>) {
  navigation.navigate(NavigatorName.AssetSelection, {
    screen: ScreenName.SelectNetwork,
    params: {
      currency: currency.id,
      context: AddAccountContexts.AddAccounts,
      sourceScreenName: ScreenName.AccountsList,
    },
  });
}
