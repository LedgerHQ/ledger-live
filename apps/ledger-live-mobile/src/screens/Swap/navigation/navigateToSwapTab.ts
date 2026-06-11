import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { SwapNavigatorParamList } from "~/components/RootNavigator/types/SwapNavigator";

type SwapTabParams = SwapNavigatorParamList[ScreenName.SwapTab];

/** Minimal navigation surface needed to open the Swap tab. */
type SwapTabNavigation = Pick<NativeStackNavigationProp<BaseNavigatorStackParamList>, "navigate">;

/**
 * Opens the Swap Live App on the Wallet 4.0 Swap tab.
 *
 * Since the v4 cleanup the Swap experience is served exclusively from the Swap tab
 * inside the Main tab navigator (`Main > Swap > SwapTab`), which provides the Wallet
 * 4.0 top navigation header and the bottom tab bar. Centralising the routing here
 * keeps every Swap entry point (deeplinks, no-funds drawers, staking error CTAs, …)
 * consistent.
 */
export function navigateToSwapTab({
  navigation,
  // `{}` is a valid (all-optional) DefaultAccountSwapParamList and keeps `params`
  // defined, which the typed `navigate` requires for the SwapTab screen.
  params = {},
}: {
  navigation: SwapTabNavigation;
  params?: SwapTabParams;
}): void {
  navigation.navigate(NavigatorName.Main, {
    screen: NavigatorName.Swap,
    params: {
      screen: ScreenName.SwapTab,
      params,
    },
  });
}
