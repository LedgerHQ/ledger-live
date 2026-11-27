import { useMemo } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowTransactionActions } from "@ledgerhq/live-common/flows/send/types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useStableGasOptions } from "@ledgerhq/live-common/flows/send/customFees/hooks/useStableGasOptions";
import { useCustomFeesViewModel } from "LLM/features/Send/screens/CustomFees/hooks/useCustomFeesViewModel";

export type FeeSelectionCustomFeesProps = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  transactionActions: SendFlowTransactionActions;
  /** Called once the custom fees are applied to the transaction. */
  onConfirm: () => void;
}>;

/** The Send custom fees form, applied to the transaction of the Wallet API fee step. */
export function useFeeSelectionCustomFeesViewModel({
  account,
  parentAccount,
  transaction,
  status,
  transactionActions,
  onConfirm,
}: FeeSelectionCustomFeesProps) {
  const currency = useMemo(
    () => getAccountCurrency(getMainAccount(account, parentAccount ?? undefined)),
    [account, parentAccount],
  );
  const stableTransaction = useStableGasOptions(transaction);

  return useCustomFeesViewModel({
    account,
    parentAccount,
    transaction: stableTransaction,
    status,
    currency,
    transactionActions,
    onConfirm,
  });
}
