import { NavigatorName, ScreenName } from "~/const";
import type {
  DeviceConnectedParams,
  ImportAccountsParams,
} from "LLM/features/Accounts/screens/ScanDeviceAccounts/customAddAccountFlow";

export default {
  onDeviceConnected: ({ navigation, routeParams }: DeviceConnectedParams) => {
    navigation.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AleoAddAccount,
      params: routeParams,
    });
  },

  onImportAccounts: ({ navigation, routeParams, accountsToAdd }: ImportAccountsParams) => {
    navigation.replace(ScreenName.AleoAddAccount, {
      ...routeParams,
      accountsToAdd,
      initialRoute: ScreenName.AleoViewKeyApprove,
    });
  },
};
