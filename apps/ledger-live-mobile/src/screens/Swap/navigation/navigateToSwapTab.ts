import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type SwapTabParams = SwapNavigatorParamList[ScreenName.SwapTab];

/** Minimal navigation surface needed to open the Swap tab. */
type SwapTabNavigation = Pick<NativeStackNavigationProp<BaseNavigatorStackParamList>, "navigate">;

/**
 * Opens the Swap Live App on the correct navigation stack.
 *
 * The SwapNavigator is registered twice: once at the base stack level (legacy,
 * pre-4.0) and once as a tab inside the Main tab navigator (Wallet 4.0). Only the
 * Main tab provides the Wallet 4.0 top navigation header and the bottom tab bar, so
 * when `shouldDisplayWallet40MainNav` is ON we must target `Main > Swap > SwapTab`.
 * Navigating to the base-level Swap navigator there lands on the legacy stack with no
 * header and no tab bar.
 *
 * Centralising the branch here keeps every Swap entry point (deeplinks, no-funds
 * drawers, staking error CTAs, …) consistent and prevents the chrome from going
 * missing again.
 */
export function navigateToSwapTab({
  navigation,
  shouldDisplayWallet40MainNav,
  // `{}` is a valid (all-optional) DefaultAccountSwapParamList and keeps `params`
  // defined, which the typed `navigate` requires for the SwapTab screen.
  params = {},
}: {
  navigation: SwapTabNavigation;
  shouldDisplayWallet40MainNav: boolean;
  params?: SwapTabParams;
}): void {
  if (shouldDisplayWallet40MainNav) {
    navigation.navigate(NavigatorName.Main, {
      screen: NavigatorName.Swap,
      params: {
        screen: ScreenName.SwapTab,
        params,
      },
    });
    return;
  }

  navigation.navigate(NavigatorName.Swap, {
    screen: ScreenName.SwapTab,
    params,
  });
}
