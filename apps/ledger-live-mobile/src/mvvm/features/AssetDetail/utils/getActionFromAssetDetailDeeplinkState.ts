import {
  CommonActions,
  getActionFromState,
  type NavigationState,
  type PartialState,
} from "@react-navigation/native";
import { ScreenName } from "~/const";

type DeeplinkState = NavigationState | PartialState<NavigationState>;

function hasMarketStateParam(params: unknown): params is { marketState: unknown } {
  if (typeof params !== "object" || params === null) {
    return false;
  }

  return (params as { marketState?: unknown }).marketState !== undefined;
}

function isAssetDetailTokenState(state: DeeplinkState): boolean {
  const route = state.routes[state.index ?? state.routes.length - 1];

  if (!route) {
    return false;
  }

  if (route.state && isAssetDetailTokenState(route.state)) {
    return true;
  }

  return (
    route.name === ScreenName.AssetDetail &&
    route.params !== undefined &&
    hasMarketStateParam(route.params)
  );
}

export function getActionFromAssetDetailDeeplinkState(
  state: DeeplinkState,
  options?: Parameters<typeof getActionFromState>[1],
) {
  if (isAssetDetailTokenState(state)) {
    return CommonActions.reset(state as PartialState<NavigationState>);
  }

  return getActionFromState(state as PartialState<NavigationState>, options);
}
