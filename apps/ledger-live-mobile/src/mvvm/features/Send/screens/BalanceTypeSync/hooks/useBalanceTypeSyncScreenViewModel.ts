import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { ComponentType } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { ScreenName } from "~/const";
import { useSendFlowActions, useSendFlowData } from "../../../context/SendFlowContext";
import {
  getSendBalanceTypeSync,
  type SendBalanceTypeSyncProps,
} from "../../../utils/familySendSlots";
import type { SendFlowNavigationProp } from "../../../types";

export type BalanceTypeSyncScreenViewModel =
  | Readonly<{ ready: false }>
  | Readonly<{
      ready: true;
      account: Account;
      transaction: Transaction;
      SyncComponent: ComponentType<SendBalanceTypeSyncProps>;
      onComplete: () => void;
      onClose: () => void;
    }>;

export function useBalanceTypeSyncScreenViewModel(): BalanceTypeSyncScreenViewModel {
  const { state } = useSendFlowData();
  const { close } = useSendFlowActions();
  const navigation = useNavigation<SendFlowNavigationProp>();
  const { account, parentAccount } = state.account;
  const { transaction } = state.transaction;

  const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : undefined;
  const accountSync = getSendBalanceTypeSync(mainAccount?.currency.family);

  const onComplete = useCallback(() => {
    navigation.replace(ScreenName.SendFlowRecipient);
  }, [navigation]);

  if (!mainAccount || !transaction || !accountSync) {
    return { ready: false };
  }

  return {
    ready: true,
    account: mainAccount,
    transaction,
    SyncComponent: accountSync.Component,
    onComplete,
    onClose: close,
  };
}
