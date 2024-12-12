import { CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorScreenParams } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";
import { DeviceSelectionNavigatorParamsList } from "../DeviceSelection/types";
import { NetworkBasedAddAccountNavigator } from "../Accounts/screens/AddAccount/types";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
type CommonParams = {
  context?: "addAccounts" | "receiveFunds";
  onSuccess?: () => void;
};

export type SelectNetworkRouteParams = CommonParams & {
  filterCurrencyIds?: string[];
  provider: {
    currenciesByNetwork: CryptoOrTokenCurrency[];
    providerId: string;
  };
};
export type AssetSelectionNavigatorParamsList = {
  [ScreenName.AddAccountsSelectCrypto]: CommonParams & {
    filterCurrencyIds?: string[];
    currency?: string;
    returnToSwap?: boolean;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.SelectNetwork]: SelectNetworkRouteParams;
  [ScreenName.AddAccountsTokenCurrencyDisclaimer]: {
    token: TokenCurrency;
    analyticsPropertyFlow?: string;
  };
  [NavigatorName.DeviceSelection]?: Partial<
    NavigatorScreenParams<DeviceSelectionNavigatorParamsList>
  >;
  [NavigatorName.AddAccounts]?: Partial<NavigatorScreenParams<NetworkBasedAddAccountNavigator>>;
};

export type AssetSelectionNavigationProps = StackNavigatorProps<
  AssetSelectionNavigatorParamsList,
  ScreenName.AddAccountsSelectCrypto
>;
