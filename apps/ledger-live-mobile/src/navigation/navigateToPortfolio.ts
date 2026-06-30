import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

/** Main → Portfolio → Wallet tab (same target as post-onboarding close and product-tour deeplink). */
export function navigateToPortfolio(
  navigation: Pick<NavigationProp<ParamListBase>, "navigate">,
): void {
  navigation.navigate(NavigatorName.Main, {
    screen: NavigatorName.Portfolio,
    params: { screen: ScreenName.Portfolio },
  });
}
