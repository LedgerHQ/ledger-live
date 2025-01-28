import { NavigatorScreenParams } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";
import { DeviceSelectionNavigatorParamsList } from "../DeviceSelection/types";
import {
  AddAccountContextType,
  NetworkBasedAddAccountNavigator,
} from "../Accounts/screens/AddAccount/types";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { AnalyticMetadata } from "../../hooks/useAnalytics/types";
export type CommonParams = {
  context?: AddAccountContextType;
  onSuccess?: () => void;
  currency?: string;
  inline?: boolean;
  sourceScreenName?: string;
};

export type SelectNetworkRouteParams = CommonParams & {
  filterCurrencyIds?: string[];
  analyticsMetadata?: AnalyticMetadata;
};
export type AssetSelectionNavigatorParamsList = {
  [ScreenName.AddAccountsSelectCrypto]: CommonParams & {
    filterCurrencyIds?: string[];
    currency?: string;
    returnToSwap?: boolean;
    analyticsPropertyFlow?: string;
  };
  [ScreenName.SelectNetwork]: SelectNetworkRouteParams;
  [NavigatorName.DeviceSelection]?: Partial<
    NavigatorScreenParams<DeviceSelectionNavigatorParamsList>
  >;
  [NavigatorName.AddAccounts]?: Partial<NavigatorScreenParams<NetworkBasedAddAccountNavigator>>;
};

export type AssetSelectionNavigationProps = StackNavigatorProps<
  AssetSelectionNavigatorParamsList,
  ScreenName.AddAccountsSelectCrypto
>;
