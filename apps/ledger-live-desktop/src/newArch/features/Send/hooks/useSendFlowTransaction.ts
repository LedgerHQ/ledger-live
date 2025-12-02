import { useCallback, useMemo } from "react";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionState, SendFlowTransactionActions, RecipientData } from "../types";

type UseSendFlowTransactionParams = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
}>;

type UseSendFlowTransactionResult = Readonly<{
  state: SendFlowTransactionState;
  actions: SendFlowTransactionActions;
}>;

export function useSendFlowTransaction({
  account,
  parentAccount,
}: UseSendFlowTransactionParams): UseSendFlowTransactionResult {
  const {
    transaction,
    setTransaction: bridgeSetTransaction,
    updateTransaction: bridgeUpdateTransaction,
    status,
    bridgeError,
    bridgePending,
    setAccount,
  } = useBridgeTransaction(() => {
    if (!account) return {};
    return { account, parentAccount: parentAccount ?? undefined };
  });

  const setTransaction = useCallback(
    (tx: Transaction) => bridgeSetTransaction(tx),
    [bridgeSetTransaction],
  );

  const updateTransaction = useCallback(
    (updater: (tx: Transaction) => Transaction) => bridgeUpdateTransaction(updater),
    [bridgeUpdateTransaction],
  );

  const setRecipient = useCallback(
    (recipient: RecipientData) => {
      if (!account || !transaction) return;

      const bridge = getAccountBridge(account, parentAccount);
      const updates: Partial<Transaction> = { recipient: recipient.address };

      if (recipient.memo !== undefined) {
        Object.assign(updates, { memo: recipient.memo });
      }
      if (recipient.destinationTag !== undefined) {
        const tagValue = recipient.destinationTag.trim();
        const parsedTag = Number(tagValue);
        if (tagValue.length > 0 && Number.isFinite(parsedTag)) {
          Object.assign(updates, { tag: parsedTag });
        }
      }

      bridgeSetTransaction(bridge.updateTransaction(transaction, updates));
    },
    [account, parentAccount, transaction, bridgeSetTransaction],
  );

  const setAccountForTransaction = useCallback(
    (newAccount: AccountLike, newParentAccount?: Account | null) => {
      setAccount(newAccount, newParentAccount ?? undefined);
    },
    [setAccount],
  );

  const state: SendFlowTransactionState = useMemo(
    () => ({
      transaction: transaction ?? null,
      status,
      bridgeError: bridgeError ?? null,
      bridgePending,
    }),
    [transaction, status, bridgeError, bridgePending],
  );

  const actions: SendFlowTransactionActions = useMemo(
    () => ({
      setTransaction,
      updateTransaction,
      setRecipient,
      setAccount: setAccountForTransaction,
    }),
    [setTransaction, updateTransaction, setRecipient, setAccountForTransaction],
  );

  return { state, actions };
}
