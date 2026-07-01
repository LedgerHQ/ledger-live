import { NavigatorName, ScreenName } from "~/const";
import type { CustomAddAccountFlow } from "LLM/features/Accounts/customAddAccountFlow";

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
} satisfies CustomAddAccountFlow;
