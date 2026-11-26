import { StackActions, useNavigation } from "@react-navigation/native";
import {
  LedgerSyncErrorMessage,
  useLedgerSyncErrorRecovery,
  type LedgerSyncErrorRecovery,
} from "@features/flow-ledger-sync";
import { NavigatorName, ScreenName } from "~/const";
import { useKeyRingClient } from "./useKeyRingClient";

export function useLifeCycle(): LedgerSyncErrorRecovery {
  const client = useKeyRingClient();
  const navigation = useNavigation();

  return useLedgerSyncErrorRecovery({
    client,
    onReset: () =>
      navigation.dispatch(
        StackActions.replace(NavigatorName.WalletSync, {
          screen: ScreenName.WalletSyncActivationInit,
        }),
      ),
    resetOnMessages: RESET_ON_MESSAGES,
  });
}

const RESET_ON_MESSAGES = [
  LedgerSyncErrorMessage.noTrustchain,
  LedgerSyncErrorMessage.membersDataUndefined,
];
