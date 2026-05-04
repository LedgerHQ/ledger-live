import { use, useCallback, useMemo } from "react";
import { applyMemoToTransaction } from "@ledgerhq/live-common/bridge/descriptor/send/memo";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionState,
  SendFlowTransactionActions,
  RecipientData,
} from "@ledgerhq/live-common/flows/send/types";
import type { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";

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
  // use() can be called conditionally (unlike hooks) — safe to gate on account nullability.
  // The Promise is cached per family in getAccountBridge, so use() returns synchronously
  // after the first render suspense.
  const bridgePromise = useMemo(
    () =>
      account
        ? (getAccountBridge(account, parentAccount) as Promise<AccountBridge<Transaction>>)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account?.id, parentAccount?.id],
  );
  const bridge: AccountBridge<Transaction> | null = bridgePromise ? use(bridgePromise) : null;
  const {
    transaction,
    setTransaction: bridgeSetTransaction,
    updateTransaction: bridgeUpdateTransaction,
    status,
    bridgeError,
    bridgePending,
    setAccount,
  } = useBridgeTransaction(bridge, () => {
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
      if (!bridge || !transaction) return;

      const updates: Partial<Transaction> = { recipient: recipient.address };

      if (recipient.memo !== undefined) {
        Object.assign(
          updates,
          applyMemoToTransaction(
            transaction.family,
            recipient.memo.value,
            recipient.memo.type,
            transaction,
          ),
        );
      }

      if (recipient.destinationTag !== undefined) {
        const parsedTag = Number(recipient.destinationTag.trim());
        if (Number.isFinite(parsedTag)) {
          Object.assign(
            updates,
            applyMemoToTransaction(transaction.family, parsedTag, undefined, transaction),
          );
        }
      }

      bridgeSetTransaction(bridge.updateTransaction(transaction, updates));
    },
    [bridge, transaction, bridgeSetTransaction],
  );

  const setAccountForTransaction = useCallback(
    (newAccount: AccountLike, newParentAccount?: Account | null) => {
      void getAccountBridge(newAccount, newParentAccount ?? undefined).then(bridge => {
        setAccount(newAccount, newParentAccount ?? undefined, bridge);
      });
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
