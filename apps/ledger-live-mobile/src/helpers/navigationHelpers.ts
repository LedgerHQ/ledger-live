import { CommonActions, type NavigationAction } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";

const screenToNavigatorMap = {
  [ScreenName.SendSummary]: NavigatorName.SendFunds,
  [ScreenName.SignTransactionSummary]: NavigatorName.SignTransaction,
  [ScreenName.SwapForm]: NavigatorName.Swap,
} as const;

type ScreenToNavigatorMap = typeof screenToNavigatorMap;
type MappedScreen = keyof ScreenToNavigatorMap;

type NavigationState = {
  key?: string;
  routes: ReadonlyArray<{ name: string; key?: string; state?: NavigationState }>;
};

type StackNavigation = {
  getState: () => NavigationState;
  dispatch: (action: NavigationAction) => void;
};

const stepsKeepingTransactionCopy = new Set<string>([
  ScreenName.SendSelectRecipient,
  ScreenName.SendAmountCoin,
]);

// BaseNavigator registers family edit screens as siblings of the flow navigator, so the state we
// get back from one is the base stack and the steps live one level down.
const findStepStack = (
  state: NavigationState | undefined,
  navigatorName: string,
): NavigationState | undefined => {
  if (!state) return undefined;
  if (state.routes.some(route => stepsKeepingTransactionCopy.has(route.name))) return state;
  return findStepStack(
    state.routes.find(route => route.name === navigatorName)?.state,
    navigatorName,
  );
};

const syncTransactionToEarlierSteps = (
  navigation: StackNavigation,
  navigatorName: string,
  transaction: unknown,
): void => {
  const stack = findStepStack(navigation.getState(), navigatorName);
  const target = stack?.key;
  if (!target) return;

  for (const route of stack.routes) {
    if (!route.key || !stepsKeepingTransactionCopy.has(route.name)) continue;

    navigation.dispatch({
      ...CommonActions.setParams({ transaction }),
      source: route.key,
      target,
    });
  }
};

export const popToScreen = <T extends MappedScreen>(
  navigation: StackNavigation & {
    popTo: (navigator: ScreenToNavigatorMap[T], params: unknown) => void;
  },
  screen: T,
  params: unknown,
): void => {
  const navigator = screenToNavigatorMap[screen];
  const transaction = (params as { transaction?: unknown } | undefined)?.transaction;

  // Mirror before popping: once popTo runs, the dispatch no longer reaches the earlier steps.
  if (screen === ScreenName.SendSummary && transaction) {
    syncTransactionToEarlierSteps(navigation, navigator, transaction);
  }

  navigation.popTo(navigator, { screen, params });
};
