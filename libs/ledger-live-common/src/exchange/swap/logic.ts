import { $Keys, $Shape } from "utility-types";
import type { SwapState, TradeMethod, AvailableProviderV3 } from "./types";
import { isExchangeSupportedByApp } from "../";
import type { AccountLike, TokenCurrency, CryptoCurrency } from "../../types";
import type { InstalledItem } from "../../apps";
import { flattenAccounts, getAccountCurrency } from "../../account";
export type CurrencyStatus = $Keys<typeof validCurrencyStatus>;
export type CurrenciesStatus = Record<string, CurrencyStatus>;
import uniq from "lodash/uniq";
import invariant from "invariant";
import { findCryptoCurrencyById, findTokenById } from "@ledgerhq/cryptoassets";
import { isCurrencyExchangeSupported } from "../";
import { isCurrencySupported } from "../../currencies";

const validCurrencyStatus = { ok: 1, noApp: 1, noAccounts: 1, outdatedApp: 1 };

export const getSwapSelectableCurrencies = (
  rawProviderData: Array<AvailableProviderV3>
) => {
  const ids: string[] = [];
  rawProviderData.forEach((provider) => {
    const { pairs } = provider;
    pairs.forEach(({ from, to }) => ids.push(from, to));
  });
  return uniq<string>(ids);
};

// TODO deprecated when noWall
export const getCurrenciesWithStatus = ({
  accounts,
  selectableCurrencies,
  installedApps,
}: {
  accounts: AccountLike[];
  selectableCurrencies: (TokenCurrency | CryptoCurrency)[];
  installedApps: InstalledItem[];
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

const reset = {
  isTimerVisible: true,
  ratesExpiration: undefined,
  error: undefined,
  exchangeRate: undefined,
};
const ratesExpirationThreshold = 60000;

export const getValidToCurrencies = ({
  selectableCurrencies,
  fromCurrency,
}: {
  selectableCurrencies: Record<TradeMethod, (TokenCurrency | CryptoCurrency)[]>;
  fromCurrency: (TokenCurrency | CryptoCurrency) | null | undefined;
}): (TokenCurrency | CryptoCurrency)[] => {
  const out: (TokenCurrency | CryptoCurrency)[] = [];
  const tradeMethods = Object.keys(selectableCurrencies);

  for (const tradeMethod of tradeMethods) {
    const currenciesForTradeMethod = selectableCurrencies[tradeMethod];

    if (currenciesForTradeMethod.includes(fromCurrency)) {
      out.push(
        ...selectableCurrencies[tradeMethod].filter((c) => c !== fromCurrency)
      );
    }
  }

  return uniq(out);
};

export const getSupportedCurrencies = ({
  providers,
  provider,
  tradeMethod,
  fromCurrency,
}: {
  providers: any;
  provider: string;
  tradeMethod?: string;
  fromCurrency?: CryptoCurrency | TokenCurrency;
}): Array<CryptoCurrency | TokenCurrency> => {
  const providerData = providers.find((p) => p.provider === provider);
  invariant(providerData, `No provider matching ${provider} was found`);
  if (!providerData) {
    throw new Error(`No provider matching ${provider} was found`);
  }

  const { pairs } = providerData;
  const ids: string[] = uniq(
    pairs.map(({ from, to, tradeMethods }) => {
      const isTo = fromCurrency;
      if (
        (!tradeMethod || tradeMethods.include(tradeMethod)) &&
        (!fromCurrency || fromCurrency.id === from)
      ) {
        return isTo ? to : from;
      }
    })
  );

  const tokenCurrencies = ids
    .map(findTokenById)
    .filter(Boolean)
    .filter((t: any) => !t.delisted);

  const cryptoCurrencies = ids
    .map(findCryptoCurrencyById)
    .filter(Boolean)
    .filter((t: any) => isCurrencySupported(t));

  return ([...cryptoCurrencies, ...tokenCurrencies] as CryptoCurrency[]).filter(
    (c) => isCurrencyExchangeSupported(c)
  );
};

export const getEnabledTradingMethods = ({
  providers,
  provider,
  fromCurrency,
  toCurrency,
}: {
  providers: any;
  provider: string;
  fromCurrency: CryptoCurrency | TokenCurrency;
  toCurrency: CryptoCurrency | TokenCurrency;
}) => {
  const providerData = providers.find((p) => p.provider === provider);
  invariant(provider, `No provider matching ${provider} was found`);

  const { pairs } = providerData;
  const match = pairs.find(
    (p) => p.from === fromCurrency.id && p.to === toCurrency.id
  );

  return match?.tradeMethod || [];
};

const allTradeMethods: TradeMethod[] = ["fixed", "float"]; // Flow i give up

export const getEnabledTradeMethods = ({
  selectableCurrencies,
  fromCurrency,
  toCurrency,
}: {
  selectableCurrencies: Record<TradeMethod, (TokenCurrency | CryptoCurrency)[]>;
  toCurrency: (TokenCurrency | CryptoCurrency) | null | undefined;
  fromCurrency: (TokenCurrency | CryptoCurrency) | null | undefined;
}): TradeMethod[] => {
  const tradeMethods: TradeMethod[] = <TradeMethod[]>(
    Object.keys(selectableCurrencies).filter((m) =>
      allTradeMethods.includes(<TradeMethod>m)
    )
  );

  return fromCurrency && toCurrency
    ? tradeMethods.filter(
        (method) =>
          allTradeMethods.includes(method) &&
          selectableCurrencies[method].includes(fromCurrency) &&
          selectableCurrencies[method].includes(toCurrency)
      )
    : tradeMethods;
};

export const reducer = (
  state: SwapState,
  {
    type,
    payload,
  }: {
    type: string;
    payload: $Shape<SwapState>;
  }
): SwapState => {
  switch (type) {
    case "onResetRate":
      return { ...state, ...reset };

    case "onSetFromCurrency":
      return {
        ...state,
        fromCurrency: payload.fromCurrency,
        useAllAmount: false,
        toCurrency:
          state.toCurrency === payload.fromCurrency
            ? undefined
            : state.toCurrency,
        exchangeRate: undefined,
      };

    case "onSetToCurrency":
      return {
        ...state,
        toCurrency: payload.toCurrency,
        toAccount: undefined,
        toParentAccount: undefined,
        ...reset,
      };

    case "onSetError":
      return { ...state, error: payload.error };

    case "onSetExchangeRate":
      return {
        ...state,
        error: undefined,
        exchangeRate: payload.exchangeRate,
        ratesExpiration: payload.withExpiration
          ? new Date(new Date().getTime() + ratesExpirationThreshold)
          : undefined,
      };

    case "onSetUseAllAmount":
      return { ...state, useAllAmount: payload.useAllAmount };

    case "onSetToAccount":
      return {
        ...state,
        toAccount: payload.toAccount,
        toParentAccount: payload.toParentAccount,
      };

    case "onSetLoadingRates":
      return { ...state, loadingRates: payload.loadingRates };

    case "onFlip":
      return {
        ...state,
        fromCurrency: state.toCurrency,
        toCurrency: state.fromCurrency,
        toAccount: payload.toAccount,
        toParentAccount: payload.toParentAccount,
      };
  }

  return state || {};
};
