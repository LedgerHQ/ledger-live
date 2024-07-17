import { getAccountCurrency, getFeesUnit } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  AmountRequired,
  FeeNotLoaded,
  NotEnoughGas,
  NotEnoughGasSwap,
  NotEnoughBalanceSwap,
} from "@ledgerhq/errors";
import { Account } from "@ledgerhq/types-live";
import { useMemo } from "react";
import useBridgeTransaction, { Result } from "../../../bridge/useBridgeTransaction";
import { Transaction } from "../../../generated/types";
import {
  ExchangeRate,
  OnNoRatesCallback,
  SwapSelectorStateType,
  SwapTransactionType,
} from "../types";
import { useFromState } from "./useFromState";
import { useReverseAccounts } from "./useReverseAccounts";
import { useToState } from "./useToState";
import { useUpdateMaxAmount } from "./useUpdateMaxAmount";
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
      .filter(maybeError => maybeError instanceof Error)
      .filter(errorOrWarning => !(errorOrWarning instanceof AmountRequired));
    const isRelevantStatus = (relevantStatus as Error) instanceof NotEnoughGas;

    if (isRelevantStatus && currency && estimatedFees) {
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
        links: [`ledgerlive://buy?${query.toString()}`],
      });
    }

    // convert to swap variation of error to display correct message to frontend.
    if (relevantStatus instanceof FeeNotLoaded) {
      return new NotEnoughBalanceSwap();
    }

    return relevantStatus;
  }, [statusEntries, currency, estimatedFees, transaction?.amount, account?.id, parentAccount?.id]);
};

type UseSwapTransactionProps = {
  accounts?: Account[];
  setExchangeRate?: SetExchangeRateCallback;
  defaultCurrency?: SwapSelectorStateType["currency"];
  defaultAccount?: SwapSelectorStateType["account"];
  defaultParentAccount?: SwapSelectorStateType["parentAccount"];
  onNoRates?: OnNoRatesCallback;
  excludeFixedRates?: boolean;
  refreshRate?: number;
  allowRefresh?: boolean;
  isEnabled?: boolean;
};

export const useSwapTransaction = ({
  accounts,
  setExchangeRate,
  defaultCurrency = selectorStateDefaultValues.currency,
  defaultAccount = selectorStateDefaultValues.account,
  defaultParentAccount = selectorStateDefaultValues.parentAccount,
  onNoRates,
  excludeFixedRates,
  refreshRate,
  allowRefresh,
  isEnabled,
}: UseSwapTransactionProps): SwapTransactionType => {
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

  const { rates, refetchRates, updateSelectedRate, countdown } = useProviderRates({
    fromState,
    toState,
    onNoRates,
    setExchangeRate,
    countdown: refreshRate,
    allowRefresh,
    isEnabled,
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
      countdown,
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
