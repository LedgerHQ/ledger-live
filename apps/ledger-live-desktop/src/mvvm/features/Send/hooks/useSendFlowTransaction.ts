import { useCallback, useMemo } from "react";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { applyMemoToTransaction } from "@ledgerhq/live-common/bridge/descriptor";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionState,
  SendFlowTransactionActions,
  RecipientData,
} from "@ledgerhq/live-common/flows/send/types";

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

  const buildRecipientUpdates = useCallback(
    (currentTransaction: Transaction, recipient: RecipientData): Partial<Transaction> => {
      const updates: Partial<Transaction> = {};

      if (recipient.address !== undefined) {
        updates.recipient = recipient.address;
      }

      if (recipient.memo !== undefined) {
        Object.assign(
          updates,
          applyMemoToTransaction(
            currentTransaction.family,
            recipient.memo.value,
            recipient.memo.type,
            currentTransaction,
          ),
        );
      }

      if (recipient.destinationTag !== undefined) {
        const trimmed = recipient.destinationTag.trim();
        if (trimmed.length > 0) {
          const parsedTag = Number(trimmed);
          if (Number.isFinite(parsedTag)) {
            Object.assign(
              updates,
              applyMemoToTransaction(
                currentTransaction.family,
                parsedTag,
                undefined,
                currentTransaction,
              ),
            );
          }
        }
      }

      return updates;
    },
    [],
  );

  const setRecipient = useCallback(
    (recipient: RecipientData) => {
      if (!account || !transaction) return;

      const bridge = getAccountBridge(account, parentAccount);
      const updates = buildRecipientUpdates(transaction, recipient);

      if (Object.keys(updates).length > 0) {
        bridgeSetTransaction(bridge.updateTransaction(transaction, updates));
      }
    },
    [account, parentAccount, transaction, bridgeSetTransaction, buildRecipientUpdates],
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
