// @flow

import { NotEnoughBalance } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import type { SwapState } from "./types";
import type { AccountLike, TokenCurrency, CryptoCurrency } from "../types";
import type { InstalledItem } from "../apps";
import { flattenAccounts, getAccountCurrency } from "../account";

const validCurrencyStatus = { ok: 1, noApps: 1, noAccounts: 1 };
export type CurrencyStatus = $Keys<typeof validCurrencyStatus>;
export type CurrenciesStatus = { [string]: CurrencyStatus };

export const initState: ({
  okCurrencies: (TokenCurrency | CryptoCurrency)[],
}) => SwapState = ({ okCurrencies }) => ({
  swap: {
    exchange: {},
    exchangeRate: undefined,
  },
  error: null,
  isLoading: false,
  useAllAmount: false,
  okCurrencies,
  fromCurrency: null,
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
  const installedAppsStatus = {};
  const notEmptyCurrencies = flattenAccounts(accounts).map(
    (a) => getAccountCurrency(a).id
  );

  for (const { name, updated } of installedApps)
    installedAppsStatus[name] = updated;
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
      mainCurrency.managerAppName in installedAppsStatus
        ? notEmptyCurrencies.includes(mainCurrency.id)
          ? "ok"
          : "noAccounts"
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
        // ratesTimestamp: new Date(),
        ratesExpired: false,
        error: null,
      };
      break;
    }
    case "setFromCurrency": {
      let toCurrency = state.toCurrency;
      if (
        !state.toCurrency ||
        state.toCurrency?.id === payload.fromCurrency?.id
      ) {
        toCurrency = state.okCurrencies.find((c) => c !== payload.fromCurrency);
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
        useAllAmount: false,
        swap: {
          ...state.swap,
          exchangeRate: null,
          exchange: {
            ...state.swap.exchange,
            toAccount: undefined,
            toParentAccount: undefined,
          },
        },
        fromAmount: BigNumber(0),
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
    case "setFromAmount": {
      let error;
      const { fromAmount, useAllAmount = false } = payload;
      if (
        state.swap.exchange.fromAccount &&
        state.swap.exchange.fromAccount.balance.lt(fromAmount)
      ) {
        error = new NotEnoughBalance();
      }

      newState = {
        ...state,
        useAllAmount,
        swap: {
          ...state.swap,
          exchangeRate: null,
        },
        fromAmount: payload.fromAmount,
        error,
      };
      break;
    }
    case "setError":
      return { ...state, error: payload.error };
    case "expireRates":
      return {
        ...state,
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
