import { useCallback, useEffect, useMemo, useRef } from "react";
import { BigNumber } from "bignumber.js";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getAccountBridge } from "../../../bridge";
import type { Account, AccountBridge, AccountLike, TransactionCommon } from "@ledgerhq/types-live";
import type { SendFlowTransactionActions } from "../types";
import type { Transaction, TransactionStatus } from "../../../generated/types";
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

  const bridgeRef = useRef<AccountBridge<TransactionCommon> | undefined>(undefined);
  useEffect(() => {
    getAccountBridge(mainAccount).then(bridge => {
      bridgeRef.current = bridge;
    }, () => undefined);
  }, [mainAccount]);

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      const bridge = bridgeRef.current;
      transactionActions.updateTransaction(currentTx => {
        if (bridge) return bridge.updateTransaction(currentTx, patch) as Transaction;
        return { ...currentTx, ...patch } as Transaction;
      });
    },
    [transactionActions],
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
