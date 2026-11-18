import { useCallback, useContext } from "react";
import {
  NavigationContainerRefContext,
  StackActions,
  useNavigation,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { NavigatorName, ScreenName } from "~/const";

/** Detail pages kept in the Base stack while hopping between Asset Detail and Account Detail. */
export const ASSET_ACCOUNT_CHAIN_MAX_DEPTH = 3;

type RouteLike = Readonly<{ name?: string; state?: StateLike }>;
type StateLike = Readonly<{ key?: string; index?: number; routes: readonly RouteLike[] }>;

type BaseParams = BaseNavigatorStackParamList;

type AssetAccountRouteName =
  | NavigatorName.AssetDetail
  | NavigatorName.Accounts
  | ScreenName.Account;

export type AssetAccountTarget = {
  [Name in AssetAccountRouteName]: [name: Name, params: BaseParams[Name]];
}[AssetAccountRouteName];

/** Base stack navigation narrowed to the Asset and Account Detail routes. */
type AssetAccountNavigation = Readonly<{ navigate: (...target: AssetAccountTarget) => void }>;

function focusedRoute(state: StateLike): RouteLike | undefined {
  return state.routes[state.index ?? state.routes.length - 1];
}

function focusedRouteNames(route: RouteLike): string[] {
  const focused = route.state && focusedRoute(route.state);
  return [route.name ?? "", ...(focused ? focusedRouteNames(focused) : [])];
}

function isAssetOrAccountRoute(route: RouteLike): boolean {
  const names = focusedRouteNames(route);
  return names.includes(NavigatorName.AssetDetail) || names.includes(ScreenName.Account);
}

const ASSET_ACCOUNT_ROUTE_NAMES = new Set<string>([
  NavigatorName.AssetDetail,
  NavigatorName.Accounts,
  ScreenName.Account,
]);

/** The stack that holds the Asset and Account Detail pages: the Base stack under the Root one in the app. */
export function findAssetAccountStack(state: StateLike): StateLike | undefined {
  const focused = focusedRoute(state);
  if (!focused) return undefined;
  if (focused.name && ASSET_ACCOUNT_ROUTE_NAMES.has(focused.name)) return state;
  return focused.state && findAssetAccountStack(focused.state);
}

/** Number of Asset or Account Detail pages stacked on top of the given stack. */
export function countTrailingAssetAccountRoutes(stack: StateLike): number {
  let count = 0;
  for (
    let index = stack.index ?? stack.routes.length - 1;
    index >= 0 && isAssetOrAccountRoute(stack.routes[index]);
    index--
  ) {
    count++;
  }
  return count;
}

/**
 * Opens the next Asset or Account Detail page. Once the Base stack holds
 * {@link ASSET_ACCOUNT_CHAIN_MAX_DEPTH} of them, the current page is replaced,
 * so Back always reaches the entry point within that many steps.
 */
export function useAssetAccountChainNavigate() {
  const navigation: AssetAccountNavigation = useNavigation<NativeStackNavigationProp<BaseParams>>();
  const container = useContext(NavigationContainerRefContext);

  return useCallback(
    (...target: AssetAccountTarget) => {
      const rootState = container?.getRootState();
      const stack = rootState && findAssetAccountStack(rootState);
      if (
        container &&
        stack &&
        countTrailingAssetAccountRoutes(stack) >= ASSET_ACCOUNT_CHAIN_MAX_DEPTH
      ) {
        const [name, params] = target;
        container.dispatch({ ...StackActions.replace(name, params), target: stack.key });
        return;
      }
      navigation.navigate(...target);
    },
    [container, navigation],
  );
}
