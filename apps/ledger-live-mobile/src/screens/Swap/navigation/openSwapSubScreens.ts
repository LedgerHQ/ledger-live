import { StackActions, type NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { SwapSubScreensNavigatorParamList } from "~/components/RootNavigator/types/SwapSubScreensNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName } from "~/const";

/** Navigation typed with {@link BASE_NAVIGATOR_ID} so `getParent(BASE_NAVIGATOR_ID)` is type-safe. */
export type SwapBaseNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

export type SwapSubScreensTarget = NavigatorScreenParams<SwapSubScreensNavigatorParamList>;

/**
 * BaseNavigator routes that a Swap sub-screen supersedes, so they can be replaced
 * instead of being left underneath: the loading drawer and the device exchange flow.
 */
const REPLACEABLE_BASE_ROUTES: ReadonlySet<string> = new Set([
  NavigatorName.SwapSubScreens,
  NavigatorName.PlatformExchange,
]);

/**
 * Opens a Swap sub-screen (History, PendingOperation, …) on top of the Swap tab.
 *
 * `StackActions.replace` carries no `target`, so BaseNavigator applies it to whichever
 * route is focused. That is what we want while a transient swap screen is on top: it is
 * swapped for the sub-screen, leaving a clean `[Main, SwapSubScreens]` stack whose back
 * action returns to the Swap tab. When the Swap tab itself is on top the focused route is
 * `Main`, and replacing that unmounts the tab navigator, leaving BaseNavigator with a
 * single route that can no longer handle the sub-screen's back action — so we push.
 *
 * Intended as the single entry point for Swap sub-screen navigation; the loading drawer
 * and the custom error screen still navigate directly.
 */
export function openSwapSubScreens({
  navigation,
  target,
}: {
  navigation: Pick<SwapBaseNavigation, "navigate" | "getParent">;
  target: SwapSubScreensTarget;
}): void {
  const baseNavigation = navigation.getParent(BASE_NAVIGATOR_ID);
  const baseState = baseNavigation?.getState();
  const focusedRouteName =
    baseState === undefined ? undefined : baseState.routes[baseState.index]?.name;

  if (baseNavigation && focusedRouteName && REPLACEABLE_BASE_ROUTES.has(focusedRouteName)) {
    baseNavigation.dispatch(StackActions.replace(NavigatorName.SwapSubScreens, target));
    return;
  }

  navigation.navigate(NavigatorName.SwapSubScreens, target);
}
