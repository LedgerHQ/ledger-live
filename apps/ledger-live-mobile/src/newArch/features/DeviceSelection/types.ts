import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { NavigatorScreenParams } from "@react-navigation/core";
import { NavigatorName, ScreenName } from "~/const";
import { NetworkBasedAddAccountNavigator } from "../Accounts/screens/AddAccount/types";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type CommonParams = {
  context?: "addAccounts" | "receiveFunds";
  onSuccess?: () => void;
  onCloseNavigation?: () => void;
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
  [ScreenName.SelectDevice]: SelectDeviceRouteParams;
  [NavigatorName.AddAccounts]?: Partial<NavigatorScreenParams<NetworkBasedAddAccountNavigator>>;
};

export type DeviceSelectionNavigationProps = StackNavigatorProps<
  DeviceSelectionNavigatorParamsList,
  ScreenName.AddAccountsSelectCrypto
>;
