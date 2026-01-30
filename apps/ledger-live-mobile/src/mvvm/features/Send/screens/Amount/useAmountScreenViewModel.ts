import { useCallback, useMemo } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "~/context/Locale";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { SendFlowUiConfig } from "@ledgerhq/live-common/flows/send/types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useSendAmount, useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector, localeSelector } from "~/reducers/settings";
import {
  useAmountInputCore,
  useQuickActionsCore,
  useInitialTransactionPreparation,
} from "@ledgerhq/live-common/flows/send/screens/amount";
import type { AmountScreenQuickAction } from "@ledgerhq/live-common/flows/send/screens/amount/types";

type UseAmountScreenViewModelParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  bridgeError: Error | null;
  uiConfig: SendFlowUiConfig;
  onUpdateTransaction: (updater: (tx: Transaction) => Transaction) => void;
}>;

export type AmountScreenViewModel = Readonly<{
  amountValue: string;
  amountInputMaxDecimalLength: number;
  currencyText: string;
  currencyPosition: "left" | "right";
  onChangeText: (text: string) => void;
  onToggleInputMode: () => void;
  toggleLabel: string;
  secondaryValue: string;
  quickActions: AmountScreenQuickAction[];
  showQuickActions: boolean;
  reviewLabel: string;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  hasInsufficientFundsError: boolean;
}>;

export function useAmountScreenViewModel({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  uiConfig,
  onUpdateTransaction,
}: UseAmountScreenViewModelParams): AmountScreenViewModel {
  const { t } = useTranslation();
  useCountervaluesPolling();

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = accountCurrency.units[0];

  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const fiatUnit = counterValueCurrency.units[0];

  const cryptoAmount = useMemo(() => {
    if (transaction.useAllAmount) {
      return status.amount ?? new BigNumber(0);
    }
    return transaction.amount ?? new BigNumber(0);
  }, [transaction.amount, transaction.useAllAmount, status.amount]);

  const { fiatAmount, calculateCryptoAmount } = useSendAmount({
    account,
    fiatCurrency: counterValueCurrency,
    cryptoAmount,
  });

  const calculateFiatFromCrypto = useCalculateCountervalueCallback({
    to: counterValueCurrency,
  });

  const updateTransactionWithPatch = useCallback(
    (patch: Partial<Transaction>) => {
      onUpdateTransaction(currentTx => {
        const bridge = getAccountBridge(account, parentAccount ?? undefined);
        return bridge.updateTransaction(currentTx, patch);
      });
    },
    [account, parentAccount, onUpdateTransaction],
  );

  const amountInput = useAmountInputCore({
    transaction,
    status,
    locale,
    accountCurrency,
    accountUnit,
    counterValueCurrency,
    fiatUnit,
    cryptoAmount,
    fiatAmount,
    calculateCryptoAmount,
    calculateFiatFromCrypto,
    onUpdateTransaction: updateTransactionWithPatch,
  });

  const rawTransactionAmount = transaction.amount ?? new BigNumber(0);
  const hasRawAmount = transaction.useAllAmount || rawTransactionAmount.gt(0);
  const shouldPrepare = Boolean(transaction.recipient) && hasRawAmount;
  const amountComputationPending = bridgePending && shouldPrepare;

  useInitialTransactionPreparation({
    shouldPrepare,
    mainAccountId: mainAccount.id,
    recipientAddress: transaction.recipient ?? "",
    bridgePending,
    updateTransactionWithPatch: () => updateTransactionWithPatch({}),
  });

  const maxAvailable = useMemo(() => {
    if (!account) return new BigNumber(0);
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = spendable ?? account.balance ?? new BigNumber(0);

    // For ratios (25%, 50%, 75%), we need to account for fees to avoid insufficient funds
    const estimatedFees = status.estimatedFees ?? new BigNumber(0);
    const safeMax = balance.minus(estimatedFees);

    return BigNumber.max(0, safeMax);
  }, [account, status.estimatedFees]);

  const quickActionsAvailableBalance = useMemo(() => {
    const spendable = "spendableBalance" in account ? account.spendableBalance : undefined;
    const balance = "balance" in account ? account.balance : new BigNumber(0);
    return spendable ?? balance ?? new BigNumber(0);
  }, [account]);

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

  const quickActions = useQuickActionsCore({
    transaction,
    maxAvailable,
    accountBalance: mainAccount.balance,
    accountUnit,
    onSetAmountFromRatio: setAmountFromRatio,
    onSelectMax: handleSelectMax,
    t,
  });

  const hasInsufficientFundsError = useMemo(() => {
    if (!status.errors?.amount) return false;
    const errorName = status.errors.amount.name;
    return (
      errorName === "NotEnoughBalance" ||
      errorName === "NotEnoughBalanceFees" ||
      errorName === "NotEnoughBalanceSwap" ||
      errorName === "NotEnoughBalanceBecauseDestinationNotCreated" ||
      errorName === "NotEnoughBalanceInParentAccount" ||
      errorName === "NotEnoughBalanceToDelegate" ||
      errorName.includes("Insufficient")
    );
  }, [status.errors?.amount]);

  const hasErrors = Object.keys(status.errors ?? {}).length > 0;
  const hasAmount = hasRawAmount;
  const reviewDisabled =
    (hasErrors && !hasInsufficientFundsError) || !hasAmount || amountComputationPending;

  const reviewLabel = hasInsufficientFundsError
    ? t("send.amount.getFunds", { currency: accountCurrency?.ticker ?? "CRYPTO" })
    : t("send.amount.review");

  return {
    amountValue: amountInput.amountValue,
    amountInputMaxDecimalLength: amountInput.amountInputMaxDecimalLength,
    currencyText: amountInput.currencyText,
    currencyPosition: amountInput.currencyPosition,
    onChangeText: amountInput.onChangeText,
    onToggleInputMode: amountInput.onToggleInputMode,
    toggleLabel: t("send.amount.switchInputMode"),
    secondaryValue: amountInput.secondaryValue,
    quickActions,
    showQuickActions: quickActionsAvailableBalance.gt(0),
    reviewLabel,
    reviewDisabled,
    reviewLoading: amountComputationPending,
    hasInsufficientFundsError,
  };
}
