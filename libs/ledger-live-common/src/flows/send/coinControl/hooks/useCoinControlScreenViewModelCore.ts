import type { Unit } from "@ledgerhq/types-cryptoassets";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/formatCurrencyUnit";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { SendFlowTransactionActions, SendFlowUiConfig } from "../../types";
import type { Transaction, TransactionStatus } from "../../../../generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import { sendFeatures } from "../../../../bridge/descriptor/send/features";
import type { CoinControlDisplayData } from "../../../../bridge/descriptor/types";
import { getChangeToReturn } from "../utils/changeToReturn";
import { useSendFlowAmountReviewCore } from "../../hooks/useSendFlowAmountReviewCore";
import { useCoinControlAmountInput } from "./useCoinControlAmountInput";

export type CoinControlScreenViewModelLabels = Readonly<{
  reviewCta: string;
  getCtaLabel: (currency: string) => string;
  strategyLabel: string;
  learnMoreLabel: string;
  coinToSendLabel: string;
  changeToReturnLabel: string;
  enterAmountPlaceholder: string;
  selectSufficientCoinsPlaceholder: string;
  amountToSendLabel: string;
  amountInputLabel: string;
  getStrategyOptionLabel: (labelKey: string) => string;
}>;

export type CoinControlChangeToReturnViewModel = Readonly<{
  changeToReturnLabel: string;
  value: string;
  placeholder: string;
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
  utxoDisplayData: CoinControlDisplayData | null;
  strategyOptionsWithLabels: readonly { value: number; label: string }[];
  changeToReturn: CoinControlChangeToReturnViewModel;
  onSelectStrategy: (value: string) => void;
  reviewLabel: string;
  reviewShowIcon: boolean;
  reviewDisabled: boolean;
  reviewLoading: boolean;
  strategyLabel: string;
  onLearnMoreClick: () => void;
  learnMoreLabel: string;
  coinToSendLabel: string;
  enterAmountPlaceholder: string;
  amountToSendLabel: string;
  amountInputLabel: string;
  networkFees: TNetworkFees;
  /** True when the active UTXO picking strategy is the coin’s “custom selection” mode. */
  isCustomPickingStrategy: boolean;
  onToggleUtxoExclusion?: (rowKey: string) => void;
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
  const amountReviewCore = useSendFlowAmountReviewCore({
    account,
    parentAccount,
    transaction,
    status,
    bridgePending,
    transactionActions,
    labels: {
      getCtaLabel: labels.getCtaLabel,
      reviewCta: labels.reviewCta,
    },
  });

  const { updateTransactionWithPatch, amountComputationPending } = amountReviewCore;

  const amountInput = useCoinControlAmountInput({
    transaction,
    status,
    onUpdateTransaction: updateTransactionWithPatch,
    locale,
    accountUnit,
  });

  const coinControlConfig = useMemo(
    () => sendFeatures.getCoinControlConfig(getAccountCurrency(account)),
    [account],
  );

  const utxoDisplayData = useMemo(() => {
    if (coinControlConfig == null) return null;
    return coinControlConfig.getDisplayData({
      account,
      transaction,
      status,
      locale,
    });
  }, [account, coinControlConfig, locale, status, transaction]);

  const customStrategyValue = coinControlConfig?.customStrategyValue;

  const isCustomPickingStrategy = useMemo(
    () =>
      customStrategyValue !== undefined &&
      "utxoStrategy" in transaction &&
      transaction.utxoStrategy !== null &&
      transaction.utxoStrategy.strategy === customStrategyValue,
    [customStrategyValue, transaction],
  );

  const customInsufficientUtxoForChangeRow = useMemo(() => {
    const isCustomStrategy =
      customStrategyValue != null &&
      "utxoStrategy" in transaction &&
      transaction.utxoStrategy != null &&
      transaction.utxoStrategy.strategy === customStrategyValue;
    const hasFilledAmount = transaction.useAllAmount || transaction.amount?.gt(0);
    if (!isCustomStrategy || !hasFilledAmount) return false;

    const utxoData = utxoDisplayData;
    const rows = utxoData?.utxoRows;
    const hasNoSelectedUtxo =
      utxoData != null &&
      rows != null &&
      rows.length > 0 &&
      utxoData.totalExcludedUTXOS === rows.length;
    const isInsufficientFundsBridgeError = status.errors?.amount instanceof NotEnoughBalance;

    return isInsufficientFundsBridgeError || hasNoSelectedUtxo;
  }, [customStrategyValue, status, transaction, utxoDisplayData]);

  const changeToReturn = useMemo((): CoinControlChangeToReturnViewModel => {
    const placeholder = customInsufficientUtxoForChangeRow
      ? labels.selectSufficientCoinsPlaceholder
      : labels.enterAmountPlaceholder;
    const hasAmountForChange = transaction.useAllAmount || transaction.amount?.gt(0);
    let value = "";
    if (hasAmountForChange && !customInsufficientUtxoForChangeRow) {
      const changeAmount = getChangeToReturn(status);
      value = formatCurrencyUnit(accountUnit, changeAmount, {
        showCode: true,
        disableRounding: true,
        locale,
      });
    }
    return {
      changeToReturnLabel: labels.changeToReturnLabel,
      value,
      placeholder,
    };
  }, [
    accountUnit,
    customInsufficientUtxoForChangeRow,
    labels.changeToReturnLabel,
    labels.enterAmountPlaceholder,
    labels.selectSufficientCoinsPlaceholder,
    locale,
    status,
    transaction.amount,
    transaction.useAllAmount,
  ]);

  const onSelectStrategy = useCallback(
    (value: string) => {
      const strategy = Number.parseInt(value, 10);
      if (Number.isNaN(strategy) || coinControlConfig === null) return;

      const patch = coinControlConfig.buildStrategyChangePatch({
        transaction,
        strategy,
        displayData: utxoDisplayData,
      });
      if (patch != null) {
        updateTransactionWithPatch(patch);
      }
    },
    [coinControlConfig, transaction, updateTransactionWithPatch, utxoDisplayData],
  );

  const strategyOptionsWithLabels = useMemo(() => {
    const options = utxoDisplayData?.pickingStrategyOptions ?? [];
    return options.map(opt => ({
      value: opt.value,
      label: labels.getStrategyOptionLabel(opt.labelKey),
    }));
  }, [utxoDisplayData?.pickingStrategyOptions, labels]);

  const resolvedAmountError = useMemo(() => {
    const isCustomStrategy =
      customStrategyValue != null &&
      "utxoStrategy" in transaction &&
      transaction.utxoStrategy != null &&
      transaction.utxoStrategy.strategy === customStrategyValue;
    const hasFilledAmount = transaction.useAllAmount || transaction.amount?.gt(0);
    if (isCustomStrategy && !hasFilledAmount) return undefined;

    const isInsufficientFundsBridgeError = status.errors?.amount instanceof NotEnoughBalance;
    // Transaction patches (e.g. toggling custom exclusions) apply before the next bridge sync;
    // status can briefly still reflect the previous pick and show a stale NotEnoughBalance.
    if (isCustomStrategy && hasFilledAmount && bridgePending && isInsufficientFundsBridgeError) {
      return undefined;
    }

    const utxoData = utxoDisplayData;
    const rows = utxoData?.utxoRows;
    const hasNoSelectedUtxo =
      utxoData != null &&
      rows != null &&
      rows.length > 0 &&
      utxoData.totalExcludedUTXOS === rows.length;
    if (
      isCustomStrategy &&
      hasFilledAmount &&
      hasNoSelectedUtxo &&
      isInsufficientFundsBridgeError
    ) {
      return undefined;
    }

    return amountError;
  }, [amountError, bridgePending, customStrategyValue, status, transaction, utxoDisplayData]);

  const onToggleUtxoExclusion = useCallback(
    (rowKey: string) => {
      if (!coinControlConfig || !isCustomPickingStrategy) return;

      const patch = coinControlConfig.buildToggleRowExclusionPatch({
        transaction,
        rowKey,
        displayData: utxoDisplayData,
      });
      if (patch) {
        updateTransactionWithPatch(patch);
      }
    },
    [
      coinControlConfig,
      isCustomPickingStrategy,
      transaction,
      updateTransactionWithPatch,
      utxoDisplayData,
    ],
  );

  return {
    amountValue: amountInput.amountValue,
    onAmountChange: amountInput.onAmountChange,
    amountError: resolvedAmountError,
    utxoDisplayData,
    strategyOptionsWithLabels,
    changeToReturn,
    onSelectStrategy,
    reviewLabel: amountReviewCore.reviewLabel,
    reviewShowIcon: amountReviewCore.reviewShowIcon,
    reviewDisabled: amountReviewCore.reviewDisabled,
    reviewLoading: amountComputationPending,
    strategyLabel: labels.strategyLabel,
    onLearnMoreClick,
    learnMoreLabel: labels.learnMoreLabel,
    coinToSendLabel: labels.coinToSendLabel,
    enterAmountPlaceholder: labels.enterAmountPlaceholder,
    amountToSendLabel: labels.amountToSendLabel,
    amountInputLabel: labels.amountInputLabel,
    networkFees,
    isCustomPickingStrategy,
    onToggleUtxoExclusion,
  };
}
