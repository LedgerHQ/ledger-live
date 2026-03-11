import type { Unit } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAccountBridge } from "../../../../bridge/impl";
import type { SendFlowTransactionActions, SendFlowUiConfig } from "../../types";
import type { Transaction, TransactionStatus } from "../../../../generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { useCallback, useMemo } from "react";
import { getChangeToReturn } from "../utils/changeToReturn";
import {
  useBitcoinUtxoDisplayData,
  type BitcoinUtxoDisplayData,
} from "../../../../families/bitcoin/react";
import { useCoinControlAmountInput } from "./useCoinControlAmountInput";

export type CoinControlScreenViewModelLabels = Readonly<{
  reviewCta: string;
  getCtaLabel: (currency: string) => string;
  strategyLabel: string;
  learnMoreLabel: string;
  coinToSendLabel: string;
  changeToReturnLabel: string;
  enterAmountPlaceholder: string;
  amountToSendLabel: string;
  amountInputLabel: string;
  getStrategyOptionLabel: (labelKey: string) => string;
}>;

export type UseCoinControlScreenViewModelCoreParams<TNetworkFees = unknown> = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  bridgePending: boolean;
  uiConfig: SendFlowUiConfig;
  transactionActions: SendFlowTransactionActions;
  locale: string;
  accountUnit: Unit;
  amountError: string | undefined;
  networkFees: TNetworkFees;
  labels: CoinControlScreenViewModelLabels;
  onLearnMoreClick: () => void;
}>;

export type CoinControlScreenViewModelCoreResult<TNetworkFees = unknown> = Readonly<{
  amountValue: string | null;
  onAmountChange: (rawValue: string) => void;
  amountError: string | undefined;
  utxoDisplayData: BitcoinUtxoDisplayData | null;
  strategyOptionsWithLabels: readonly { value: number; label: string }[];
  changeToReturnFormatted: string;
  onSelectStrategy: (value: string) => void;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  strategyLabel: string;
  onLearnMoreClick: () => void;
  learnMoreLabel: string;
  coinToSendLabel: string;
  changeToReturnLabel: string;
  enterAmountPlaceholder: string;
  amountToSendLabel: string;
  amountInputLabel: string;
  networkFees: TNetworkFees;
}>;

export function useCoinControlScreenViewModelCore<TNetworkFees = unknown>({
  account,
  parentAccount,
  transaction,
  status,
  bridgePending,
  uiConfig: _uiConfig,
  transactionActions,
  locale,
  accountUnit,
  amountError,
  networkFees,
  labels,
  onLearnMoreClick,
}: UseCoinControlScreenViewModelCoreParams<TNetworkFees>): CoinControlScreenViewModelCoreResult<TNetworkFees> {
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
    ? labels.getCtaLabel(accountCurrency?.ticker ?? "CRYPTO")
    : labels.reviewCta;

  const amountInput = useCoinControlAmountInput({
    transaction,
    status,
    onUpdateTransaction: updateTransactionWithPatch,
    locale,
    accountUnit,
  });

  const utxoDisplayData = useBitcoinUtxoDisplayData({
    account,
    transaction,
    status,
    locale,
  });

  const changeToReturnFormatted = useMemo(() => {
    const hasAmountForChange =
      transaction.useAllAmount || (transaction.amount != null && transaction.amount.gt(0));
    if (!hasAmountForChange) return "";
    const changeAmount = getChangeToReturn(status);
    return formatCurrencyUnit(accountUnit, changeAmount, {
      showCode: true,
      disableRounding: true,
      locale,
    });
  }, [accountUnit, locale, status, transaction.amount, transaction.useAllAmount]);

  const onSelectStrategy = useCallback(
    (value: string) => {
      const strategy = parseInt(value, 10);
      if (Number.isNaN(strategy)) return;
      if (!("utxoStrategy" in transaction) || transaction.utxoStrategy == null) return;

      updateTransactionWithPatch({
        utxoStrategy: { ...transaction.utxoStrategy, strategy, excludeUTXOs: [] },
      } as Partial<Transaction>);
    },
    [transaction, updateTransactionWithPatch],
  );

  const strategyOptionsWithLabels = useMemo(() => {
    const options = utxoDisplayData?.pickingStrategyOptions ?? [];
    return options.map(opt => ({
      value: opt.value,
      label: labels.getStrategyOptionLabel(opt.labelKey),
    }));
  }, [utxoDisplayData?.pickingStrategyOptions, labels]);

  return {
    amountValue: amountInput.amountValue,
    onAmountChange: amountInput.onAmountChange,
    amountError,
    utxoDisplayData,
    strategyOptionsWithLabels,
    changeToReturnFormatted,
    onSelectStrategy,
    reviewLabel,
    reviewShowIcon: !hasInsufficientFundsError,
    reviewDisabled,
    reviewLoading: amountComputationPending,
    strategyLabel: labels.strategyLabel,
    onLearnMoreClick,
    learnMoreLabel: labels.learnMoreLabel,
    coinToSendLabel: labels.coinToSendLabel,
    changeToReturnLabel: labels.changeToReturnLabel,
    enterAmountPlaceholder: labels.enterAmountPlaceholder,
    amountToSendLabel: labels.amountToSendLabel,
    amountInputLabel: labels.amountInputLabel,
    networkFees,
  };
}
