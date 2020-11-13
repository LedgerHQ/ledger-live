// @flow

import { BigNumber } from "bignumber.js";
import type { SwapState } from "./types";
import { isExchangeSupportedByApp } from "../";
import type {
  Account,
  AccountLike,
  TokenCurrency,
  CryptoCurrency,
} from "../../types";
import type { InstalledItem } from "../../apps";
import { flattenAccounts, getAccountCurrency } from "../../account";
const validCurrencyStatus = { ok: 1, noApp: 1, noAccounts: 1, outdatedApp: 1 };
export type CurrencyStatus = $Keys<typeof validCurrencyStatus>;
export type CurrenciesStatus = { [string]: CurrencyStatus };

export const initState: ({
  okCurrencies: (TokenCurrency | CryptoCurrency)[],
  defaultCurrency?: TokenCurrency | CryptoCurrency,
  defaultAccount?: AccountLike,
  defaultParentAccount?: Account,
}) => SwapState = ({
  okCurrencies,
  defaultCurrency,
  defaultAccount,
  defaultParentAccount,
}) => ({
  swap: {
    exchange: {
      fromAccount: defaultAccount,
      fromParentAccount: defaultParentAccount,
    },
    exchangeRate: undefined,
  },
  error: null,
  isLoading: false,
  useAllAmount: false,
  okCurrencies,
  fromCurrency: defaultCurrency,
  toCurrency: null,
  fromAmount: BigNumber(0),
});

export const canRequestRates = (state: SwapState) => {
  const { swap, error, fromAmount } = state;
  const { exchange, exchangeRate } = swap;
  const { fromAccount, toAccount } = exchange;
  return !!(
    fromAccount &&
    toAccount &&
    fromAmount &&
    !exchangeRate &&
    !error &&
    fromAmount.gt(0)
  );
};

export const getCurrenciesWithStatus = ({
  accounts,
  selectableCurrencies,
  installedApps,
}: {
  accounts: AccountLike[],
  selectableCurrencies: (TokenCurrency | CryptoCurrency)[],
  installedApps: InstalledItem[],
}): CurrenciesStatus => {
  const statuses = {};
  const installedAppMap = {};
  const notEmptyCurrencies = flattenAccounts(accounts)
    .filter((a) => a.balance.gt(0))
    .map((a) => getAccountCurrency(a).id);

  for (const data of installedApps) installedAppMap[data.name] = data;

  for (const c of selectableCurrencies) {
    if (c.type !== "CryptoCurrency" && c.type !== "TokenCurrency") continue;
    const mainCurrency =
      c.type === "TokenCurrency"
        ? c.parentCurrency
        : c.type === "CryptoCurrency"
        ? c
        : null;

    if (!mainCurrency) continue;
    statuses[c.id] =
      mainCurrency.managerAppName in installedAppMap
        ? isExchangeSupportedByApp(
            mainCurrency.id,
            installedAppMap[mainCurrency.managerAppName].version
          )
          ? notEmptyCurrencies.includes(c.id)
            ? "ok"
            : "noAccounts"
          : "outdatedApp"
        : "noApp";
  }
  return statuses;
};

export const reducer = (
  state: SwapState,
  { type, payload }: { type: string, payload: any }
) => {
  let newState;

  switch (type) {
    case "patchExchange":
      newState = {
        ...state,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: { ...state.swap.exchange, ...payload },
        },
        error: null,
      };
      break;
    case "fetchRates":
      newState = { ...state, isLoading: true, error: null };
      break;
    case "setRate": {
      newState = {
        ...state,
        swap: { ...state.swap, exchangeRate: payload.rate },
        ratesTimestamp: new Date(),
        error: null,
      };
      break;
    }
    case "setFromCurrency": {
      let toCurrency = state.toCurrency;
      if (state.toCurrency?.id === payload.fromCurrency?.id) {
        toCurrency = null;
      }
      newState = {
        ...state,
        useAllAmount: false,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: {
            ...state.swap.exchange,
            fromAccount: undefined,
            fromParentAccount: undefined,
            toAccount: undefined,
            toParentAccount: undefined,
          },
        },
        fromAmount: BigNumber(0),
        fromCurrency: payload.fromCurrency,
        toCurrency,
        error: null,
      };
      break;
    }
    case "setToCurrency": {
      newState = {
        ...state,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: {
            ...state.swap.exchange,
            toAccount: undefined,
            toParentAccount: undefined,
          },
        },
        toCurrency: payload.toCurrency,
        error: null,
      };
      break;
    }
    case "setFromAccount": {
      newState = {
        ...state,
        useAllAmount: false,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: {
            ...state.swap.exchange,
            ...payload,
          },
        },
        fromAmount: BigNumber(0),
        error: null,
      };
      break;
    }
    case "setToAccount": {
      newState = {
        ...state,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: {
            ...state.swap.exchange,
            ...payload,
          },
        },
        error: null,
      };
      break;
    }
    case "setFromAmount": {
      let error;
      const { fromAmount, useAllAmount = false } = payload;

      newState = {
        ...state,
        useAllAmount,
        swap: {
          ...state.swap,
          exchangeRate: null,
        },
        fromAmount: fromAmount,
        ratesTimestamp: undefined,
        error,
      };
      break;
    }
    case "setError":
      return { ...state, error: payload.error };
    case "expireRates":
      return {
        ...state,
        ratesTimestamp: undefined,

        swap: {
          ...state.swap,
          exchangeRate: null,
        },
      };
    default:
      return state;
  }
  return newState;
};
