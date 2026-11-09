import type {
  SendAccount,
  SendAccountLike,
  SendTransaction,
  SendTransactionStatus,
} from "../registry";
import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { getAccountCurrency, getMainAccount } from "../internals/account";
import { useSendFlowPorts } from "../ports/SendFlowPortsContext";
import type { SendFlowTransactionActions } from "../types";
import { getMaxAvailable, isInsufficientFundsAmountError } from "../amount/utils/amountReview";

export type UseSendFlowAmountReviewCoreLabels = Readonly<{
  getCtaLabel: (currency: string) => string;
  reviewCta: string;
}>;

export type UseSendFlowAmountReviewCoreParams = Readonly<{
  account: SendAccountLike;
  parentAccount: SendAccount | null;
  transaction: SendTransaction;
  status: SendTransactionStatus;
  bridgePending: boolean;
  transactionActions: SendFlowTransactionActions;
  labels: UseSendFlowAmountReviewCoreLabels;
}>;

export type UseSendFlowAmountReviewCoreResult = Readonly<{
  mainAccount: SendAccount;
  accountCurrency: ReturnType<typeof getAccountCurrency>;
  updateTransactionWithPatch: (patch: Partial<SendTransaction>) => void;
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
  const { getAccountBridge } = useSendFlowPorts();
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  const updateTransactionWithPatch = useCallback(
    async (patch: Partial<SendTransaction>) => {
      const bridge = await getAccountBridge(account, parentAccount ?? undefined);
      transactionActions.updateTransaction(currentTx => bridge.updateTransaction(currentTx, patch));
    },
    [account, parentAccount, transactionActions, getAccountBridge],
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
