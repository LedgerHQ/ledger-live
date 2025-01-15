import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { NavigatorScreenParams } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";
import { NetworkBasedAddAccountNavigator } from "../Accounts/screens/AddAccount/types";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type CommonParams = {
  context?: "addAccounts" | "receiveFunds";
  onSuccess?: () => void;
};

export type SelectDeviceRouteParams = CommonParams & {
  accountId?: string;
  parentId?: string;
  currency: CryptoCurrency;
  inline?: boolean;
  analyticsPropertyFlow?: string;
  createTokenAccount?: boolean;
};

export type DeviceSelectionNavigatorParamsList = {
  [ScreenName.ConnectDevice]: CommonParams & {
    account?: AccountLike;
    accountId: string;
    parentId?: string;
    notSkippable?: boolean;
    title?: string;
    appName?: string;
    onError?: () => void;
  };
  [ScreenName.SelectDevice]: SelectDeviceRouteParams;
  [NavigatorName.AddAccounts]?: Partial<NavigatorScreenParams<NetworkBasedAddAccountNavigator>>;
};

export type DeviceSelectionNavigationProps = StackNavigatorProps<
  DeviceSelectionNavigatorParamsList,
  ScreenName.AddAccountsSelectCrypto
>;
