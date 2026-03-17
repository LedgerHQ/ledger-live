import { CommonActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

type NavigationStateWithRouteNames = {
  routeNames?: string[];
};

type NavigationWithState = {
  dispatch(action: ReturnType<typeof CommonActions.reset>): void;
  getState(): NavigationStateWithRouteNames | undefined;
  getParent():
    | {
        dispatch(action: ReturnType<typeof CommonActions.reset>): void;
        goBack(): void;
      }
    | undefined;
  goBack(): void;
};

export function hasSwapTabRoute(state: NavigationStateWithRouteNames | undefined) {
  const routeNames = state?.routeNames;
  return Array.isArray(routeNames) && routeNames.includes(ScreenName.SwapTab);
}

function getResetToSwapTabAction() {
  return CommonActions.reset({
    index: 0,
    routes: [
      {
        name: NavigatorName.Main,
        params: {
          screen: NavigatorName.Swap,
          params: {
            screen: ScreenName.SwapTab,
          },
        },
      },
    ],
  });
}

function getResetToLegacySwapAction() {
  // Legacy Swap lives outside Main in the base stack, but we still need Main
  // underneath it so the Swap form back button returns to home instead of
  // leaving Swap as a dead-end root route.
  return CommonActions.reset({
    index: 1,
    routes: [
      {
        name: NavigatorName.Main,
      },
      {
        name: NavigatorName.Swap,
        params: {
          screen: ScreenName.SwapTab,
        },
      },
    ],
  });
}

export function navigateBackToSwapTab({
  navigation,
  shouldDisplayWallet40MainNav,
}: {
  navigation: NavigationWithState;
  shouldDisplayWallet40MainNav: boolean;
}) {
  if (hasSwapTabRoute(navigation.getState())) {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ScreenName.SwapTab }],
      }),
    );
    return;
  }

  const parentNavigation = navigation.getParent();

  if (!parentNavigation) {
    navigation.goBack();
    return;
  }

  if (!shouldDisplayWallet40MainNav) {
    parentNavigation.dispatch(getResetToLegacySwapAction());
    return;
  }

  parentNavigation.dispatch(getResetToSwapTabAction());
}
