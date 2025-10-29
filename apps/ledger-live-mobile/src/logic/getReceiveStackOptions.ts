import { RouteProp } from "@react-navigation/core";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName } from "~/const";
import { NoahRouteProp, shouldShowNoahMenu } from "~/logic/shouldShowNoahMenu";

export const getReceiveStackOptions = ({
  route,
  noahEnabled,
}: {
  route: RouteProp<BaseNavigatorStackParamList, NavigatorName.ReceiveFunds>;
  noahEnabled: boolean | undefined;
}): NativeStackNavigationOptions => {
  if (!noahEnabled) return { headerShown: false };
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const showMenu = shouldShowNoahMenu(route as unknown as NoahRouteProp, noahEnabled ?? false);

  // NOTE: Always use modal presentation when Noah is enabled to prevent remounting.
  // The actual menu display is controlled by `useReceiveNoahEntry` in individual
  // screens
  return {
    headerShown: false,
    presentation: "containedTransparentModal",
    gestureEnabled: true,
    headerTitle: "",
    headerRight: () => null,
    headerBackButtonDisplayMode: "minimal",
    title: "",
    contentStyle: {
      opacity: showMenu ? 0.5 : 1,
    },
  };
};
