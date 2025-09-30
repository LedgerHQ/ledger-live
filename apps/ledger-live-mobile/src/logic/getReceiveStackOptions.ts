import { RouteProp } from "@react-navigation/core";
import { CardStyleInterpolators, StackNavigationOptions } from "@react-navigation/stack";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName } from "~/const";
import { NoahRouteProp, shouldShowNoahMenu } from "~/logic/shouldShowNoahMenu";

export const getReceiveStackOptions = ({
  route,
  noahEnabled,
}: {
  route: RouteProp<BaseNavigatorStackParamList, NavigatorName.ReceiveFunds>;
  noahEnabled: boolean | undefined;
}): StackNavigationOptions => {
  const showMenu = shouldShowNoahMenu(route as unknown as NoahRouteProp, noahEnabled ?? false);

  if (!showMenu) {
    return { headerShown: false };
  }

  return {
    headerShown: false,
    presentation: "transparentModal",
    headerMode: undefined,
    cardStyle: { opacity: 1 },
    gestureEnabled: true,
    headerTitle: "",
    headerRight: () => null,
    headerBackButtonDisplayMode: "minimal",
    title: "",
    cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  };
};
