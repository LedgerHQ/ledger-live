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

export function navigateBackToSwapTab({ navigation }: { navigation: NavigationWithState }) {
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

  parentNavigation.dispatch(getResetToSwapTabAction());
}

export function isGoingToSwapHistory(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("routes" in payload)) {
    return false;
  }

  const routes = payload.routes;

  if (!Array.isArray(routes)) {
    return false;
  }

  return routes.some(route => route?.name === ScreenName.SwapHistory);
}
