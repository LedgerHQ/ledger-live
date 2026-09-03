import { StackActions, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

export function navigateToPayTab(
  navigation: Pick<NavigationProp<ParamListBase>, "dispatch">,
): void {
  navigation.dispatch(
    StackActions.replace(NavigatorName.Main, {
      screen: NavigatorName.PayTab,
      params: { screen: ScreenName.PayTab },
    }),
  );
}
