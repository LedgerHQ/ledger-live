import { NavigatorName, ScreenName } from "~/const";
import type { DeviceConnectedParams } from "LLM/features/Accounts/customAddAccountFlow";

export default {
  onDeviceConnected: ({ navigation, routeParams }: DeviceConnectedParams) => {
    // Exclude onCloseNavigation when undefined so it doesn't override the screen's
    // initialParams (which provides the correct exit callback from Navigator.tsx).
    const { onCloseNavigation, ...restParams } = routeParams;
    navigation.navigate(NavigatorName.AddAccounts, {
      screen: ScreenName.AleoAddAccount,
      params: {
        ...restParams,
        ...(typeof onCloseNavigation === "function" && { onCloseNavigation }),
      },
    });
  },
};
