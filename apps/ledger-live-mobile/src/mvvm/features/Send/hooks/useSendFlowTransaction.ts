import { useCallback, useMemo } from "react";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { buildRecipientTransactionPatch } from "@ledgerhq/live-common/bridge/descriptor/send/memo";
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
      if (!account || !transaction || !bridge) return;

      const updates = buildRecipientTransactionPatch(
        transaction,
        recipient,
      ) as Partial<Transaction>;

      setTransaction(bridge.updateTransaction(transaction, updates));
    },
    [account, bridge, transaction, setTransaction],
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
      setAccount,
    }),
    [setTransaction, updateTransaction, setRecipient, setAccount],
  );

  return { state, actions };
}
