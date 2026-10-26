import type { ComponentType } from "react";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useSendFlowData } from "../../../context/SendFlowContext";
import {
  getSendBalanceTypeSync,
  type SendBalanceTypeSyncProps,
} from "../../../utils/familySendSlots";

export type BalanceTypeSyncScreenViewModel =
  | Readonly<{ ready: false }>
  | Readonly<{
      ready: true;
      account: Account;
      transaction: Transaction;
      SyncComponent: ComponentType<SendBalanceTypeSyncProps>;
    }>;

export function useBalanceTypeSyncScreenViewModel(): BalanceTypeSyncScreenViewModel {
  const { state } = useSendFlowData();
  const { account, parentAccount } = state.account;
  const { transaction } = state.transaction;

  const mainAccount = account ? getMainAccount(account, parentAccount ?? undefined) : undefined;
  const accountSync = getSendBalanceTypeSync(mainAccount?.currency.family);

  if (!mainAccount || !transaction || !accountSync) {
    return { ready: false };
  }

  return {
    ready: true,
    account: mainAccount,
    transaction,
    SyncComponent: accountSync.Component,
  };
}
