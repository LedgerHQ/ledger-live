import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { NavigatorName } from "~/const";

/** Main → Portfolio → Wallet tab (same target as post-onboarding close and product-tour deeplink). */
export function navigateToPortfolioWalletTab(
  navigation: Pick<NavigationProp<ParamListBase>, "navigate">,
): void {
  navigation.navigate(NavigatorName.Main, {
    screen: NavigatorName.Portfolio,
    params: { screen: NavigatorName.WalletTab },
  });
}
