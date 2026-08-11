import { CommonActions, type NavigationAction } from "@react-navigation/native";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { NavigatorName, ScreenName } from "~/const";

type EditTagNavigation = {
  getState: () => {
    routes: ReadonlyArray<{
      name: string;
      state?: { key?: string; routes?: ReadonlyArray<{ name: string; key?: string }> };
    }>;
  };
  dispatch: (action: NavigationAction) => void;
};

/**
 * Pushes a summary-step tag edit onto the amount route's params so the amount step re-applies it
 * instead of reverting to its own stale copy on back-navigation (LIVE-35403). No-op when the
 * amount step isn't in the stack.
 *
 * The dispatch needs `target` (the SendFunds navigator key) as well as `source` (the amount route
 * key): this screen is bound to the root navigator, and React Navigation only bubbles an
 * untargeted SET_PARAMS up to parents, never down into a child navigator.
 */
export function syncTransactionToAmountStep(
  navigation: EditTagNavigation,
  transaction: Transaction,
): void {
  const sendFundsRoute = navigation
    .getState()
    .routes.find(route => route.name === NavigatorName.SendFunds);
  const sendFundsNavigatorKey = sendFundsRoute?.state?.key;
  const amountRouteKey = sendFundsRoute?.state?.routes?.find(
    route => route.name === ScreenName.SendAmountCoin,
  )?.key;
  if (!sendFundsNavigatorKey || !amountRouteKey) return;

  navigation.dispatch({
    ...CommonActions.setParams({ transaction }),
    source: amountRouteKey,
    target: sendFundsNavigatorKey,
  });
}
