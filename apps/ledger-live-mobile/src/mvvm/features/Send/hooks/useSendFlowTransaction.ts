import { useCallback, useMemo } from "react";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { applyMemoToTransaction } from "@ledgerhq/live-common/bridge/descriptor/send/memo";
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
  // useAccountBridgeOrNull resolves the async bridge via React's use(); when account is null,
  // it returns null so useBridgeTransaction can handle the no-account state gracefully.
  const bridge = useAccountBridgeOrNull<Transaction>(account, parentAccount);

  const {
    transaction,
    setTransaction,
    updateTransaction,
    status,
    bridgeError,
    bridgePending,
    setAccount,
  } = useBridgeTransaction(bridge, () => {
    if (!account) return {};
    return { account, parentAccount: parentAccount ?? undefined };
  });

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
            applyMemoToTransaction(transaction.family, parsedTag, transaction),
          );
        }
      }

      setTransaction(bridge.updateTransaction(transaction, updates));
    },
    [bridge, transaction, setTransaction],
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

  const setAccountForTransaction = useCallback(
    (newAccount: AccountLike, newParentAccount?: Account | null) => {
      setAccount(newAccount, newParentAccount ?? undefined, getAccountBridge(newAccount, newParentAccount ?? undefined));
    },
    [setAccount],
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
