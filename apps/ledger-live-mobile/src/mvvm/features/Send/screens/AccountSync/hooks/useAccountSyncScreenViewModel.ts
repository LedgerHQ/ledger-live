import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { ComponentType } from "react";
import type { Account } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { ScreenName } from "~/const";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { getSendAccountSync, type SendAccountSyncProps } from "../../../utils/familySendSlots";
import type { SendFlowNavigationProp } from "../../../types";

export type AccountSyncScreenViewModel =
  | Readonly<{ ready: false }>
  | Readonly<{
      ready: true;
      account: Account;
      SyncComponent: ComponentType<SendAccountSyncProps>;
      onComplete: () => void;
    }>;

export function useAccountSyncScreenViewModel(): AccountSyncScreenViewModel {
  const { state } = useSendFlowData();
  const navigation = useNavigation<SendFlowNavigationProp>();
  const { account, parentAccount } = state.account;

  const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : undefined;
  const accountSync = getSendAccountSync(mainAccount?.currency.family);

  const onComplete = useCallback(() => {
    navigation.replace(ScreenName.SendFlowRecipient);
  }, [navigation]);

  if (!mainAccount || !accountSync) {
    return { ready: false };
  }

  return {
    ready: true,
    account: mainAccount,
    SyncComponent: accountSync.Component,
    onComplete,
  };
}
