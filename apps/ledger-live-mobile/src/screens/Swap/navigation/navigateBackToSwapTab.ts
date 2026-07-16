import { CommonActions } from "@react-navigation/native";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";

type NavigationStateWithRouteNames = {
  routeNames?: string[];
};

type NavigationWithState = {
  dispatch(action: ReturnType<typeof CommonActions.reset>): void;
  getState(): NavigationStateWithRouteNames | undefined;
  getParent(id?: string):
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

  // Wallet 4.0: the Swap sub-screens navigator is pushed on top of Main (which
  // is already on the Swap tab) directly under the Base navigator. We target
  // Base explicitly via its id rather than positional getParent() so popping
  // always removes the whole sub-screens navigator and returns to the Swap tab
  // — a bare getParent() silently resolves by tree position and would break if
  // a navigator level were ever inserted in between. See LIVE-28498.
  const baseNavigation = navigation.getParent(BASE_NAVIGATOR_ID);

  if (!baseNavigation) {
    navigation.goBack();
    return;
  }

  // goBack (rather than a reset) so the transition plays the natural back (pop)
  // animation; a reset replays the forward (push) animation and the screen
  // slides out the wrong way.
  baseNavigation.goBack();
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
