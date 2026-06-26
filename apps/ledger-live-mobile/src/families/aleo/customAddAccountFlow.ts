import { NavigatorName, ScreenName } from "~/const";
import type {
  DeviceConnectedParams,
  ImportAccountsParams,
} from "LLM/features/Accounts/screens/ScanDeviceAccounts/customAddAccountFlow";

export default {
  onDeviceConnected: ({ navigation, routeParams }: DeviceConnectedParams) => {
    // Exclude onCloseNavigation when undefined so it doesn't override the screen's
    // initialParams (which provides the correct exit callback from Navigator.tsx).
    const { onCloseNavigation, ...restParams } = routeParams;
    navigation.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AleoAddAccount,
      params: {
        ...restParams,
        ...(typeof onCloseNavigation === "function" ? { onCloseNavigation } : {}),
      },
    });
  },

  onImportAccounts: ({ navigation, routeParams, accountsToAdd }: ImportAccountsParams) => {
    // Same as onDeviceConnected: omit undefined onCloseNavigation to preserve initialParams.
    const { onCloseNavigation, ...restParams } = routeParams;
    navigation.replace(ScreenName.AleoAddAccount, {
      ...restParams,
      ...(typeof onCloseNavigation === "function" ? { onCloseNavigation } : {}),
      accountsToAdd,
      initialRoute: ScreenName.AleoViewKeyApprove,
    });
  },
};
