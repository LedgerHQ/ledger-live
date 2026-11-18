import { useCallback, useContext } from "react";
import {
  NavigationContainerRefContext,
  StackActions,
  useNavigation,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";

/** Detail pages kept in the root stack while hopping between Asset Detail and Account Detail. */
export const ASSET_ACCOUNT_CHAIN_MAX_DEPTH = 3;

type RouteLike = Readonly<{ name?: string; state?: StateLike }>;
type StateLike = Readonly<{ key?: string; index?: number; routes: readonly RouteLike[] }>;

type BaseParams = BaseNavigatorStackParamList;

export type AssetAccountDestination =
  | Readonly<{ name: NavigatorName.AssetDetail; params: BaseParams[NavigatorName.AssetDetail] }>
  | Readonly<{ name: NavigatorName.Accounts; params: BaseParams[NavigatorName.Accounts] }>
  | Readonly<{ name: ScreenName.Account; params: BaseParams[ScreenName.Account] }>;

function navigateTo(
  navigation: NativeStackNavigationProp<BaseParams>,
  destination: AssetAccountDestination,
) {
  switch (destination.name) {
    case NavigatorName.AssetDetail:
      return navigation.navigate(destination.name, destination.params);
    case NavigatorName.Accounts:
      return navigation.navigate(destination.name, destination.params);
    case ScreenName.Account:
      return navigation.navigate(destination.name, destination.params);
  }
}

function focusedRouteNames(route: RouteLike): string[] {
  const nested = route.state;
  const focused = nested?.routes[nested.index ?? nested.routes.length - 1];
  return [route.name ?? "", ...(focused ? focusedRouteNames(focused) : [])];
}

function isAssetOrAccountRoute(route: RouteLike): boolean {
  const names = focusedRouteNames(route);
  return names.includes(NavigatorName.AssetDetail) || names.includes(ScreenName.Account);
}

/** Number of Asset or Account Detail pages stacked on top of the root stack. */
export function countTrailingAssetAccountRoutes(rootState: StateLike): number {
  let count = 0;
  for (
    let index = rootState.index ?? rootState.routes.length - 1;
    index >= 0 && isAssetOrAccountRoute(rootState.routes[index]);
    index--
  ) {
    count++;
  }
  return count;
}

/**
 * Opens the next Asset or Account Detail page. Once the root stack holds
 * {@link ASSET_ACCOUNT_CHAIN_MAX_DEPTH} of them, the current page is replaced,
 * so Back always reaches the entry point within that many steps.
 */
export function useAssetAccountChainNavigate() {
  const navigation = useNavigation<NativeStackNavigationProp<BaseParams>>();
  const container = useContext(NavigationContainerRefContext);

  return useCallback(
    (destination: AssetAccountDestination) => {
      const rootState = container?.getRootState();
      if (
        container &&
        rootState &&
        countTrailingAssetAccountRoutes(rootState) >= ASSET_ACCOUNT_CHAIN_MAX_DEPTH
      ) {
        const replace = StackActions.replace(destination.name, destination.params);
        container.dispatch({ ...replace, target: rootState.key });
        return;
      }
      navigateTo(navigation, destination);
    },
    [container, navigation],
  );
}
