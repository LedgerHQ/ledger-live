import { CommonActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

type NavigationStateWithRouteNames = {
  routeNames?: string[];
};

type NavigationWithState = {
  dispatch(action: ReturnType<typeof CommonActions.reset>): void;
  getState(): NavigationStateWithRouteNames | undefined;
  getParent(): { dispatch(action: ReturnType<typeof CommonActions.reset>): void } | undefined;
  goBack(): void;
};

type RootResetOptions = {
  shouldDisplayWallet40MainNav: boolean;
};

export function hasSwapTabRoute(state: NavigationStateWithRouteNames | undefined) {
  const routeNames = state?.routeNames;
  return Array.isArray(routeNames) && routeNames.includes(ScreenName.SwapTab);
}

function getResetToSwapTabAction({
  shouldDisplayWallet40MainNav,
}: RootResetOptions) {
  return CommonActions.reset({
    index: 0,
    routes: shouldDisplayWallet40MainNav
      ? [
          {
            name: NavigatorName.Main,
            params: {
              screen: NavigatorName.Swap,
              params: {
                screen: ScreenName.SwapTab,
              },
            },
          },
        ]
      : [
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

  parentNavigation.dispatch(getResetToSwapTabAction({ shouldDisplayWallet40MainNav }));
}
