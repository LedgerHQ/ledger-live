import { useCallback, useMemo } from "react";
import { buildRecipientTransactionPatch } from "@ledgerhq/live-common/bridge/descriptor/send/memo";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridgeOrNull } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionState,
  SendFlowTransactionActions,
  RecipientData,
} from "@ledgerhq/live-common/flows/send/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";

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
      if (!account || !transaction || !bridge) return;

      const balanceTypeConfig = sendFeatures.getBalanceTypeConfig(getAccountCurrency(account));
      const updates = {
        ...buildRecipientTransactionPatch(transaction, recipient),
        // Every recipient write passes here, so a coin holding self-transfer state has it
        // set by the shortcut that prefills its own pool and cleared by anything else.
        ...balanceTypeConfig?.buildSelfTransferPatch({
          isSelfTransfer: recipient.isSelfTransfer === true,
        }),
      } as Partial<Transaction>;

      bridgeSetTransaction(bridge.updateTransaction(transaction, updates));
    },
    [account, bridge, transaction, bridgeSetTransaction],
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
