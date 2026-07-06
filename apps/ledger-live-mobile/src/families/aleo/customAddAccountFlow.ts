import { NavigatorName, ScreenName } from "~/const";
import type { CustomAddAccountFlow } from "LLM/features/Accounts/utils/customAddAccountFlow";

export default {
  onDeviceConnected: ({ navigation, routeParams }) => {
    // Exclude onCloseNavigation when undefined so it doesn't override the default
    // injected by Aleo AddAccountNavigator (handleClose) via initialParams.
    const { onCloseNavigation, ...restParams } = routeParams;

    navigation.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AleoAddAccount,
      params: {
        ...restParams,
        ...(typeof onCloseNavigation === "function" ? { onCloseNavigation } : {}),
      },
    });
  },
  onImportAccounts: ({ navigation, routeParams, accountsToAdd }) => {
    // Same as onDeviceConnected: omit undefined onCloseNavigation to preserve initialParams.
    const { onCloseNavigation, ...restParams } = routeParams;
    navigation.replace(ScreenName.AleoAddAccount, {
      ...restParams,
      ...(typeof onCloseNavigation === "function" ? { onCloseNavigation } : {}),
      accountsToAdd,
      initialRouteName: ScreenName.AleoViewKeyApprove,
    });
  },
  onScanDeviceAccountsBack: ({ navigation }) => {
    navigation.goBack();
  },
  scanDeviceAccountsCtaI18nKey: "aleo.addAccount.stepScanAccounts.cta.shareViewKeys",
} satisfies CustomAddAccountFlow;
