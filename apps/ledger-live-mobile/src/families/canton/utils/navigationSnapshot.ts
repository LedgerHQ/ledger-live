import { CommonActions } from "@react-navigation/native";
import type { NavigationProp, ParamListBase, RouteProp } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import type { TransferProposalAction } from "../PendingTransferProposals/types";

export type NavigationNavigationSnapshot = {
  type: "navigation";
  navigator: NavigatorName;
  screen: ScreenName;
  params?: Record<string, unknown>;
};

export type TransferProposalSnapshot = {
  type: "transfer-proposal";
  action: TransferProposalAction;
  contractId: string;
  navigator: NavigatorName;
  screen: ScreenName;
  params?: Record<string, unknown>;
};

export type NavigationSnapshot = NavigationNavigationSnapshot | TransferProposalSnapshot;

export type ScreenRoute = RouteProp<
  Record<ScreenName, Record<string, unknown> | undefined>,
  ScreenName
>;

export function createNavigationSnapshot(route: ScreenRoute): NavigationSnapshot {
  const navigator = getNavigatorForScreen(route.name);
  return {
    type: "navigation",
    navigator,
    screen: route.name,
    params: route.params,
  };
}

export function restoreNavigationSnapshot(
  navigation: NavigationProp<ParamListBase>,
  snapshot: NavigationSnapshot | undefined,
): void {
  if (!snapshot) return;

  if (snapshot.type === "transfer-proposal") {
    // For transfer-proposal snapshots, navigate back to the screen
    // The screen component will handle restoring the action
    const { navigator, screen, params } = snapshot;
    navigation.dispatch(
      CommonActions.navigate({
        name: navigator,
        params: {
          screen,
          params: {
            ...params,
            restoreModalState: {
              action: snapshot.action,
              contractId: snapshot.contractId,
            },
          },
        },
      }),
    );
  } else {
    const { navigator, screen, params } = snapshot;
    navigation.dispatch(
      CommonActions.navigate({
        name: navigator,
        params: {
          screen,
          params,
        },
      }),
    );
  }
}

const SEND_FLOW_SCREENS = new Set<ScreenName>([
  ScreenName.SendCoin,
  ScreenName.SendSelectRecipient,
  ScreenName.SendAmountCoin,
  ScreenName.SendSummary,
  ScreenName.SendConnectDevice,
  ScreenName.SendValidationSuccess,
  ScreenName.SendBroadcastError,
]);

export function getNavigatorForScreen(screenName: ScreenName): NavigatorName {
  if (SEND_FLOW_SCREENS.has(screenName)) {
    return NavigatorName.SendFunds;
  }

  if (screenName === ScreenName.Account) {
    return NavigatorName.Accounts;
  }

  return NavigatorName.AccountSettings;
}
