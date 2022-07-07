import { AmountRequired } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { useMemo } from "react";
import {
  RatesReducerState,
  useFromState,
  useProviderRates,
  useToState,
} from ".";
import useBridgeTransaction, {
  Result as UseBridgeTransactionReturnType,
} from "../../../bridge/useBridgeTransaction";
import { ExchangeRate } from "../types";
import { useReverseAccounts } from "./useReverseAccounts";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useUpdateMaxAmount } from "./useUpdateMaxAmount";

export type SwapSelectorStateType = {
  currency: null | undefined | TokenCurrency | CryptoCurrency;
  account: null | undefined | Account | TokenAccount;
  parentAccount: null | undefined | Account;
  amount: null | undefined | BigNumber;
};
export type SwapDataType = {
  from: SwapSelectorStateType;
  to: SwapSelectorStateType;
  isMaxEnabled: boolean;
  isSwapReversable: boolean;
  rates: RatesReducerState;
  refetchRates: () => void;
  targetAccounts?: Account[];
};
export const selectorStateDefaultValues = {
  currency: null,
  account: null,
  parentAccount: null,
  amount: null,
};

export type SwapTransactionType = UseBridgeTransactionReturnType & {
  swap: SwapDataType;
  setFromAccount: (account: SwapSelectorStateType["account"]) => void;
  setToAccount: (
    currency: SwapSelectorStateType["currency"],
    account: SwapSelectorStateType["account"],
    parentAccount: SwapSelectorStateType["parentAccount"]
  ) => void;
  setFromAmount: (amount: BigNumber) => void;
  setToAmount: (amount: BigNumber) => void;
  setToCurrency: (currency: SwapSelectorStateType["currency"]) => void;
  toggleMax: () => void;
  reverseSwap: () => void;
  fromAmountError?: Error;
};

export type OnNoRatesCallback = (arg: {
  fromState: SwapSelectorStateType;
  toState: SwapSelectorStateType;
}) => void;
export type SetExchangeRateCallback = (
  exchangeRate?: ExchangeRate | null
) => void;
export type SetIsSendMaxLoading = (boolean) => void;

export const useFromAmountError = (
  errors: Record<string, Error | undefined>
): Error | undefined => {
  const fromAmountError = useMemo(() => {
    const [error] = [errors?.gasPrice, errors?.amount]
      .filter(Boolean)
      .filter((error) => !(error instanceof AmountRequired));

    return error;
  }, [errors?.gasPrice, errors?.amount]);

  return fromAmountError;
};

export const useSwapTransaction = ({
  accounts,
  setExchangeRate,
  setIsSendMaxLoading,
  defaultCurrency = selectorStateDefaultValues.currency,
  defaultAccount = selectorStateDefaultValues.account,
  defaultParentAccount = selectorStateDefaultValues.parentAccount,
  onNoRates,
}: {
  accounts?: Account[];
  setExchangeRate?: SetExchangeRateCallback;
  setIsSendMaxLoading?: SetIsSendMaxLoading;
  defaultCurrency?: SwapSelectorStateType["currency"];
  defaultAccount?: SwapSelectorStateType["account"];
  defaultParentAccount?: SwapSelectorStateType["parentAccount"];
  onNoRates?: OnNoRatesCallback;
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
  const { toState, setToAccount, setToAmount, setToCurrency, targetAccounts } =
    useToState({ accounts });
  const {
    account: fromAccount,
    parentAccount: fromParentAccount,
    currency: fromCurrency,
  } = fromState;
  const { account: toAccount } = toState;
  const transaction = bridgeTransaction?.transaction;

  const fromAmountError = useFromAmountError(bridgeTransaction.status.errors);

  const { isSwapReversable, reverseSwap } = useReverseAccounts({
    accounts,
    fromAccount,
    toAccount,
    fromParentAccount,
    fromCurrency,
    setFromAccount,
    setToAccount,
  });

  const { isMaxEnabled, toggleMax } = useUpdateMaxAmount({
    setFromAmount,
    account: fromAccount,
    parentAccount: fromParentAccount,
    transaction,
    feesStrategy: transaction?.feesStrategy,
    setIsSendMaxLoading,
  });

  const { rates, refetchRates } = useProviderRates({
    fromState,
    toState,
    transaction,
    onNoRates,
    setExchangeRate,
  });

  return {
    ...bridgeTransaction,
    swap: {
      to: toState,
      from: fromState,
      isMaxEnabled,
      isSwapReversable,
      rates,
      refetchRates,
      targetAccounts,
    },
    setFromAmount,
    toggleMax,
    fromAmountError,
    setToAccount,
    setToCurrency,
    setFromAccount,
    setToAmount,
    reverseSwap,
  };
};
