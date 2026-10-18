import { useCallback, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
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
import { accountsSelector } from "~/renderer/reducers/accounts";

type UseSendFlowTransactionParams = Readonly<{
  account: AccountLike | null;
  parentAccount: Account | null;
  initialRecipient?: string;
}>;

type UseSendFlowTransactionResult = Readonly<{
  state: SendFlowTransactionState;
  actions: SendFlowTransactionActions;
}>;

export function useSendFlowTransaction({
  account,
  parentAccount,
  initialRecipient,
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
    updateAccount,
  } = useBridgeTransaction(bridge, () => {
    if (!account) return {};
    if (!bridge?.createTransaction || !initialRecipient) {
      return { account, parentAccount: parentAccount ?? undefined };
    }

    try {
      const created = bridge.createTransaction(getMainAccount(account, parentAccount));
      let transaction = bridge.updateTransaction(created, { recipient: initialRecipient });
      if (account.type !== "Account") {
        transaction = { ...transaction, subAccountId: account.id };
      }

      return { account, parentAccount: parentAccount ?? undefined, transaction };
    } catch {
      return { account, parentAccount: parentAccount ?? undefined };
    }
  });

  const accounts = useSelector(accountsSelector);

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

      const currency = getAccountCurrency(account);
      const balanceTypeConfig = sendFeatures.getBalanceTypeConfig(currency);
      const updates = {
        ...buildRecipientTransactionPatch(transaction, recipient),
        // Every recipient write passes here, so a coin holding self-transfer state has it
        // set by the shortcut that prefills its own pool and cleared by anything else.
        ...balanceTypeConfig?.buildSelfTransferPatch({
          isSelfTransfer: recipient.isSelfTransfer === true,
          transaction,
        }),
        // Also on every write: records which other account of the user the recipient is
        // (when the coin declares it to the device) and clears it for anything else.
        ...sendFeatures.getRecipientAccountPatchBuilder(currency)({
          account,
          recipient: recipient.address,
          accounts,
          transaction,
        }),
      } as Partial<Transaction>;

      bridgeSetTransaction(bridge.updateTransaction(transaction, updates));
    },
    [account, accounts, bridge, transaction, bridgeSetTransaction],
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
      updateAccount,
    }),
    [setTransaction, updateTransaction, setRecipient, setAccountForTransaction, updateAccount],
  );

  return { state, actions };
}
