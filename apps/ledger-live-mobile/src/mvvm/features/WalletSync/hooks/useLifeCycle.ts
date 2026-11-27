import { StackActions, useNavigation } from "@react-navigation/native";
import {
  useLedgerSyncErrorRecovery,
  type LedgerSyncErrorRecovery,
} from "@features/platform-ledger-sync";
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
    resetOnUnresolvedMembers: true,
  });
}
