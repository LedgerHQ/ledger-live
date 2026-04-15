import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getAccountBridge } from "../../../bridge/impl";
import type { SendFlowTransactionActions } from "../types";
import type { Transaction, TransactionStatus } from "../../../generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { getMaxAvailable, isInsufficientFundsAmountError } from "../amount/utils/amountReview";

export type UseSendFlowAmountReviewCoreLabels = Readonly<{
  getCtaLabel: (currency: string) => string;
  reviewCta: string;
}>;

export type UseSendFlowAmountReviewCoreParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  transactionActions: SendFlowTransactionActions;
  labels: UseSendFlowAmountReviewCoreLabels;
}>;

export type UseSendFlowAmountReviewCoreResult = Readonly<{
  mainAccount: Account;
  accountCurrency: ReturnType<typeof getAccountCurrency>;
  updateTransactionWithPatch: (patch: Partial<Transaction>) => void;
  hasRawAmount: boolean;
  shouldPrepare: boolean;
  amountComputationPending: boolean;
  maxAvailable: BigNumber;
  hasInsufficientFundsError: boolean;
  hasErrors: boolean;
  hasAmount: boolean;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
}>;

export function useSendFlowAmountReviewCore({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  transactionActions,
  labels,
}: UseSendFlowAmountReviewCoreParams): UseSendFlowAmountReviewCoreResult {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      transactionActions.updateTransaction(currentTx => {
        const bridge = getAccountBridge(account, parentAccount ?? undefined);
        return bridge.updateTransaction(currentTx, patch);
      });
    },
    [account, parentAccount, transactionActions],
  );

  const rawTransactionAmount = transaction.amount ?? new BigNumber(0);
  const hasRawAmount = transaction.useAllAmount || rawTransactionAmount.gt(0);
  const shouldPrepare = Boolean(transaction.recipient) && hasRawAmount;
  const amountComputationPending = bridgePending && shouldPrepare;

  const estimatedFees = useMemo(
    () => status.estimatedFees ?? new BigNumber(0),
    [status.estimatedFees],
  );
  const maxAvailable = useMemo(
    () => getMaxAvailable(account, estimatedFees),
    [account, estimatedFees],
  );

  const hasInsufficientFundsError = useMemo(() => isInsufficientFundsAmountError(status), [status]);

  const hasErrors = Object.keys(status.errors ?? {}).length > 0;
  const hasAmount = hasRawAmount;
  const reviewDisabled =
    (hasErrors && !hasInsufficientFundsError) || !hasAmount || amountComputationPending;

  const reviewLabel = hasInsufficientFundsError
    ? labels.getCtaLabel(accountCurrency?.ticker ?? "CRYPTO")
    : labels.reviewCta;

  return {
    mainAccount,
    accountCurrency,
    updateTransactionWithPatch,
    hasRawAmount,
    shouldPrepare,
    amountComputationPending,
    maxAvailable,
    hasInsufficientFundsError,
    hasErrors,
    hasAmount,
    reviewLabel,
    reviewShowIcon: !hasInsufficientFundsError,
    reviewDisabled,
  };
}
