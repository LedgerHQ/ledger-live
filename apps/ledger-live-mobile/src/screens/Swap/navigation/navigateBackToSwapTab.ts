import { CommonActions, NavigationState } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

type NavigationWithState = {
  dispatchReset(action: ReturnType<typeof CommonActions.reset>): void;
  getState(): NavigationState | undefined;
  getParent(): { dispatchReset(action: ReturnType<typeof CommonActions.reset>): void } | undefined;
  goBack(): void;
};

type RootResetOptions = {
  shouldDisplayWallet40MainNav: boolean;
};

export function hasSwapTabRoute(getState: () => NavigationState | undefined) {
  const routeNames = getState()?.routeNames;
  return Array.isArray(routeNames) && routeNames.includes(ScreenName.SwapTab);
}

export function getResetToSwapTabAction({
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
  if (hasSwapTabRoute(() => navigation.getState())) {
    navigation.dispatchReset(
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

  parentNavigation.dispatchReset(getResetToSwapTabAction({ shouldDisplayWallet40MainNav }));
}
