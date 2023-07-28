import { AmountRequired } from "@ledgerhq/errors";
import { useMemo } from "react";
import {
  ExchangeRate,
  SwapSelectorStateType,
  OnNoRatesCallback,
  SwapTransactionType,
  AvailableProviderV3,
  OnBeforeTransaction,
} from "../types";
import useBridgeTransaction from "../../../bridge/useBridgeTransaction";
import { useFromState } from "./useFromState";
import { useProviderRates } from "./useProviderRates";
import { useToState } from "./useToState";
import { useReverseAccounts } from "./useReverseAccounts";
import { Account } from "@ledgerhq/types-live";
import { useUpdateMaxAmount } from "./useUpdateMaxAmount";

export const selectorStateDefaultValues = {
  currency: undefined,
  account: undefined,
  parentAccount: undefined,
  amount: undefined,
};

export type SetExchangeRateCallback = (exchangeRate?: ExchangeRate) => void;

export const useFromAmountStatusMessage = (
  status: Record<string, Error | undefined>,
  statusToInclude: string[],
): Error | undefined => {
  const statusEntries = useMemo(
    () => statusToInclude.map(s => status?.[s]),
    [status, statusToInclude],
  );

  return useMemo(() => {
    // The order of errors/warnings here will determine the precedence
    const [relevantStatus] = statusEntries
      .filter(Boolean)
      .filter(errorOrWarning => !(errorOrWarning instanceof AmountRequired));

    return relevantStatus;
  }, [statusEntries]);
};

export const useSwapTransaction = ({
  accounts,
  setExchangeRate,
  defaultCurrency = selectorStateDefaultValues.currency,
  defaultAccount = selectorStateDefaultValues.account,
  defaultParentAccount = selectorStateDefaultValues.parentAccount,
  onNoRates,
  onBeforeTransaction,
  excludeFixedRates,
  providers,
  timeout,
  timeoutErrorMessage,
}: {
  accounts?: Account[];
  setExchangeRate?: SetExchangeRateCallback;
  defaultCurrency?: SwapSelectorStateType["currency"];
  defaultAccount?: SwapSelectorStateType["account"];
  defaultParentAccount?: SwapSelectorStateType["parentAccount"];
  onNoRates?: OnNoRatesCallback;
  onBeforeTransaction?: OnBeforeTransaction;
  excludeFixedRates?: boolean;
  providers?: AvailableProviderV3[];
  timeout?: number;
  timeoutErrorMessage?: string;
} = {}): SwapTransactionType => {
  const bridgeTransaction = useBridgeTransaction(() => ({
    account: defaultAccount,
    parentAccount: defaultParentAccount,
  }));
  const { fromState, setFromAccount, setFromAmount } = useFromState({
    accounts,
    defaultCurrency,
    defaultAccount,
    defaultParentAccount,
    bridgeTransaction,
  });
  const { toState, setToAccount, setToAmount, setToCurrency, targetAccounts } = useToState({
    accounts,
  });
  const {
    account: fromAccount,
    parentAccount: fromParentAccount,
    currency: fromCurrency,
  } = fromState;
  const { account: toAccount } = toState;
  const transaction = bridgeTransaction?.transaction;

  const fromAmountError = useFromAmountStatusMessage(bridgeTransaction.status.errors, ["amount"]);
  // treat the gasPrice error as a warning for swap.
  const fromAmountWarning = useFromAmountStatusMessage(bridgeTransaction.status.errors, [
    "gasPrice",
  ]);

  const { isSwapReversable, reverseSwap } = useReverseAccounts({
    accounts,
    fromAccount,
    toAccount,
    fromParentAccount,
    fromCurrency,
    setFromAccount,
    setToAccount,
  });

  const { isMaxEnabled, toggleMax, isMaxLoading } = useUpdateMaxAmount({
    setFromAmount,
    account: fromAccount,
    parentAccount: fromParentAccount,
    transaction,
    feesStrategy: transaction?.feesStrategy,
  });

  const { rates, refetchRates, updateSelectedRate } = useProviderRates({
    fromState,
    toState,
    transaction,
    onBeforeTransaction,
    onNoRates,
    setExchangeRate,
    providers,
    timeout,
    timeoutErrorMessage,
  });

  return {
    ...bridgeTransaction,
    swap: {
      to: toState,
      from: fromState,
      isMaxEnabled,
      isMaxLoading,
      isSwapReversable,
      rates:
        rates.value && excludeFixedRates
          ? {
              ...rates,
              value: rates.value.filter(v => v.tradeMethod !== "fixed"),
            }
          : rates,
      refetchRates,
      updateSelectedRate,
      targetAccounts,
    },
    setFromAmount,
    toggleMax,
    fromAmountError,
    fromAmountWarning,
    setToAccount,
    setToCurrency,
    setFromAccount,
    setToAmount,
    reverseSwap,
  };
};
