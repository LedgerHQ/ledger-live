import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type {
  SendFlowTransactionActions,
  SendFlowUiConfig,
} from "@ledgerhq/live-common/flows/send/types";
import type { AmountScreenMessage, AmountScreenViewModel } from "../types";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { useAmountInputController } from "./useAmountInputController";
import { useQuickActions } from "./useQuickActions";
import { useNetworkFees } from "../../../hooks/useNetworkFees";
import {
  getStatusError,
  pickBlockingError,
} from "@ledgerhq/live-common/flows/send/amount/utils/errors";

type UseAmountScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  onReview: () => void;
  onGetFunds: () => void;
  onSelectCoinControl?: () => void;
}>;

export function useAmountScreenViewModel({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  bridgeError: _bridgeError,
  uiConfig,
  transactionActions,
  onReview,
  onGetFunds,
  onSelectCoinControl,
}: UseAmountScreenViewModelParams): AmountScreenViewModel {
  const { t } = useTranslation();

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);

  const networkFees = useNetworkFees({
    account,
    parentAccount,
    transaction,
    status,
    uiConfig,
    transactionActions,
    onSelectCoinControl,
  });

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      transactionActions.updateTransaction(currentTx => {
        const bridge = getAccountBridge(account, parentAccount ?? undefined);
        return bridge.updateTransaction(currentTx, patch);
      });
    },
    [account, parentAccount, transactionActions],
  );

  const amountInput = useAmountInputController({
    account,
    parentAccount,
    transaction,
    status,
    onUpdateTransaction: updateTransactionWithPatch,
  });

  const rawTransactionAmount = transaction.amount ?? new BigNumber(0);
  const hasRawAmount = transaction.useAllAmount || rawTransactionAmount.gt(0);
  const shouldPrepare = Boolean(transaction.recipient) && hasRawAmount;
  const amountComputationPending = bridgePending && shouldPrepare;

  const maxAvailable = useMemo(() => {
    if (!account) return new BigNumber(0);
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = spendable ?? account.balance ?? new BigNumber(0);

    const estimatedFees = status.estimatedFees ?? new BigNumber(0);
    const safeMax = balance.minus(estimatedFees);

    return BigNumber.max(0, safeMax);
  }, [account, status.estimatedFees]);

  const setAmountFromRatio = useCallback(
    (nextAmount: BigNumber) => {
      if (maxAvailable.lte(0)) return;
      amountInput.cancelPendingUpdates();
      const safeAmount = BigNumber.max(nextAmount, 0);
      amountInput.updateBothInputs(safeAmount);
      updateTransactionWithPatch({
        amount: safeAmount,
        useAllAmount: false,
      });
    },
    [amountInput, maxAvailable, updateTransactionWithPatch],
  );

  const handleSelectMax = useCallback(() => {
    amountInput.cancelPendingUpdates();
    updateTransactionWithPatch({
      useAllAmount: true,
      amount: new BigNumber(0),
    });
  }, [updateTransactionWithPatch, amountInput]);

  const quickActions = useQuickActions({
    account,
    parentAccount,
    transaction,
    maxAvailable,
    onSetAmountFromRatio: setAmountFromRatio,
    onSelectMax: handleSelectMax,
  });

  // Message logic
  const amountError = status.errors?.amount;
  const amountWarningRaw = status.warnings?.amount ?? status.warnings?.feeTooHigh;
  const recipientErrorRaw = getStatusError(status.errors, "recipient");
  const otherBlockingErrorRaw = useMemo(() => {
    const candidate = pickBlockingError(status.errors);
    return candidate?.name === "AmountRequired" ? undefined : candidate;
  }, [status.errors]);

  const isAmountRequiredError = status.errors?.amount?.name === "AmountRequired";

  const isFeeTooHigh =
    status.warnings?.amount?.name === "FeeTooHigh" ||
    status.warnings?.feeTooHigh?.name === "FeeTooHigh";

  const cryptoCurrency =
    accountCurrency.type === "TokenCurrency" ? accountCurrency.parentCurrency : accountCurrency;

  const isStellarMultisignBlocked =
    cryptoCurrency?.family === "stellar" && recipientErrorRaw?.name === "StellarSourceHasMultiSign";

  const amountMessage: AmountScreenMessage | null = (() => {
    if (isStellarMultisignBlocked && recipientErrorRaw) {
      return { type: "error", error: recipientErrorRaw };
    }
    if (amountError && !isAmountRequiredError && hasRawAmount) {
      return { type: "error", error: amountError };
    }
    if (amountWarningRaw && hasRawAmount) {
      return { type: isFeeTooHigh ? "info" : "warning", error: amountWarningRaw };
    }
    if (otherBlockingErrorRaw && hasRawAmount) {
      return { type: "error", error: otherBlockingErrorRaw };
    }
    return null;
  })();

  const hasInsufficientFundsError = useMemo(() => {
    if (!status.errors?.amount) return false;
    const errorName = status.errors.amount.name;
    return errorName.startsWith("NotEnough") || errorName.includes("Insufficient");
  }, [status.errors?.amount]);

  const hasErrors = Object.keys(status.errors ?? {}).length > 0;
  const hasAmount = hasRawAmount;
  const reviewDisabled =
    (hasErrors && !hasInsufficientFundsError) ||
    !hasAmount ||
    amountComputationPending ||
    amountInput.isTyping;

  const reviewLabel = useMemo(
    () =>
      hasInsufficientFundsError
        ? t("send.newSendFlow.getCta", { currency: accountCurrency?.ticker ?? "CRYPTO" })
        : t("send.newSendFlow.reviewCta"),
    [hasInsufficientFundsError, t, accountCurrency],
  );

  return useMemo(
    () => ({
      ready: true,
      amountInput: {
        value: amountInput.value,
        currencyText: amountInput.currencyText,
        currencyPosition: amountInput.currencyPosition,
        secondaryValue: amountInput.secondaryValue,
        maxDecimalLength: amountInput.maxDecimalLength,
        isDisabled: isStellarMultisignBlocked,
        isTyping: amountInput.isTyping,
        onChangeText: amountInput.onChangeText,
        onToggleMode: amountInput.onToggleMode,
      },
      networkFees,
      quickActions: {
        actions: quickActions,
        show: mainAccount.balance.gt(0),
      },
      reviewButton: {
        label: reviewLabel,
        showIcon: !hasInsufficientFundsError,
        disabled: reviewDisabled,
        loading: amountComputationPending,
        onPress: hasInsufficientFundsError ? onGetFunds : onReview,
      },
      message: amountMessage,
    }),
    [
      amountInput,
      isStellarMultisignBlocked,
      networkFees,
      quickActions,
      mainAccount.balance,
      reviewLabel,
      hasInsufficientFundsError,
      reviewDisabled,
      amountComputationPending,
      onGetFunds,
      onReview,
      amountMessage,
    ],
  );
}
