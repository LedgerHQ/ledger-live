import {
  AmountRequired,
  FeeNotLoaded,
  FeeNotLoadedSwap,
  NotEnoughGas,
  NotEnoughGasSwap,
} from "@ledgerhq/errors";
import { useMemo } from "react";
import {
  SwapSelectorStateType,
  OnNoRatesCallback,
  SwapTransactionType,
  ExchangeRate,
} from "../types";
import useBridgeTransaction, { Result } from "../../../bridge/useBridgeTransaction";
import { useFromState } from "./useFromState";
import { useToState } from "./useToState";
import { useReverseAccounts } from "./useReverseAccounts";
import { Account } from "@ledgerhq/types-live";
import { useUpdateMaxAmount } from "./useUpdateMaxAmount";
import { Transaction } from "../../../generated/types";
import { getAccountCurrency, getFeesUnit } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { useProviderRates } from "./v5/useProviderRates";

export const selectorStateDefaultValues = {
  currency: undefined,
  account: undefined,
  parentAccount: undefined,
  amount: undefined,
};

export type SetExchangeRateCallback = (exchangeRate?: ExchangeRate) => void;

export const useFromAmountStatusMessage = (
  { account, parentAccount, status, transaction }: Result<Transaction>,
  // The order of errors/warnings here will determine the precedence
  statusTypeToInclude: string[],
): Error | undefined => {
  const statusEntries = useMemo(
    () => statusTypeToInclude.map(statusType => (status.errors || status.warnings)?.[statusType]),
    [status.errors, status.warnings, statusTypeToInclude],
  );

  const currency = useMemo(() => {
    if (parentAccount) {
      return getAccountCurrency(parentAccount);
    }
    if (account) {
      return getAccountCurrency(account);
    }
    return undefined;
  }, [account, parentAccount]);

  const estimatedFees = useMemo(() => {
    return status.estimatedFees;
  }, [status]);

  return useMemo(() => {
    // don't return an error/warning if we have no transaction or if transaction.amount <= 0
    if (transaction?.amount.lte(0)) return undefined;

    const [relevantStatus] = statusEntries
      .filter(Boolean)
      .filter(errorOrWarning => !(errorOrWarning instanceof AmountRequired));

    if (relevantStatus instanceof NotEnoughGas && currency && estimatedFees) {
      const query = new URLSearchParams({
        // get account id first and set it equal to account.
        // if parent account exists then overwrite the former.
        ...(account?.id ? { account: account.id } : {}),
        ...(parentAccount?.id ? { account: parentAccount.id } : {}),
      });
      return new NotEnoughGasSwap(undefined, {
        fees: formatCurrencyUnit(getFeesUnit(currency), estimatedFees),
        ticker: currency.ticker,
        cryptoName: currency.name,
        links: [`/platform/multibuy?${query.toString()}`],
      });
    }

    // convert to swap variation of error to display correct message to frontend.
    if (relevantStatus instanceof FeeNotLoaded) {
      return new FeeNotLoadedSwap();
    }

    return relevantStatus;
  }, [statusEntries, currency, estimatedFees, transaction?.amount, account?.id, parentAccount?.id]);
};

export const useSwapTransaction = ({
  accounts,
  setExchangeRate,
  defaultCurrency = selectorStateDefaultValues.currency,
  defaultAccount = selectorStateDefaultValues.account,
  defaultParentAccount = selectorStateDefaultValues.parentAccount,
  onNoRates,
  excludeFixedRates,
}: {
  accounts?: Account[];
  setExchangeRate?: SetExchangeRateCallback;
  defaultCurrency?: SwapSelectorStateType["currency"];
  defaultAccount?: SwapSelectorStateType["account"];
  defaultParentAccount?: SwapSelectorStateType["parentAccount"];
  onNoRates?: OnNoRatesCallback;
  excludeFixedRates?: boolean;
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
    fromCurrencyAccount: fromState.account,
  });

  const {
    account: fromAccount,
    parentAccount: fromParentAccount,
    currency: fromCurrency,
  } = fromState;

  const { account: toAccount } = toState;

  const fromAmountError = useFromAmountStatusMessage(bridgeTransaction, ["amount", "gasLimit"]);
  // treat the gasPrice error as a warning for swap.
  const fromAmountWarning = useFromAmountStatusMessage(bridgeTransaction, ["gasPrice"]);

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
    bridge: bridgeTransaction,
  });

  const { rates, refetchRates, updateSelectedRate } = useProviderRates({
    fromState,
    toState,
    onNoRates,
    setExchangeRate,
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
