import { useCallback, useMemo } from "react";
import { AccountLike } from "../types";
import { useCurrencies } from "../currencies/react";
import {
  accountToPlatformAccount,
  currencyToPlatformCurrency,
} from "./converters";
import {
  filterPlatformAccounts,
  filterPlatformCurrencies,
  AccountFilters,
  CurrencyFilters,
} from "./filters";
import { isPlatformSupportedCurrency } from "./helpers";
import {
  ListPlatformAccount,
  ListPlatformCurrency,
  PlatformCurrency,
  AppManifest,
} from "./types";
import { getParentAccount } from "../account";

export function usePlatformUrl(
  manifest: AppManifest,
  params: { background: string; text: string; loadDate?: Date },
  inputs: Record<string, string>
): URL {
  return useMemo(() => {
    const url = new URL(manifest.url.toString());

    if (inputs) {
      for (const key in inputs) {
        if (Object.prototype.hasOwnProperty.call(inputs, key)) {
          url.searchParams.set(key, inputs[key]);
        }
      }
    }

    url.searchParams.set("backgroundColor", params.background);
    url.searchParams.set("textColor", params.text);
    if (params.loadDate) {
      url.searchParams.set("loadDate", params.loadDate.valueOf().toString());
    }

    if (manifest.params) {
      url.searchParams.set("params", JSON.stringify(manifest.params));
    }

    return url;
  }, [manifest.url, manifest.params, params, inputs]);
}

export function useListPlatformAccounts(
  accounts: AccountLike[]
): ListPlatformAccount {
  return useCallback(
    (filters: AccountFilters = {}) => {
      const platformAccounts = accounts.map((account) => {
        const parentAccount = getParentAccount(account, accounts);

        return accountToPlatformAccount(account, parentAccount);
      });

      return filterPlatformAccounts(platformAccounts, filters);
    },
    [accounts]
  );
}

export function usePlatformCurrencies(
  includeTokens = false
): PlatformCurrency[] {
  const currencies = useCurrencies(includeTokens);

  return useMemo(() => {
    return currencies
      .filter(isPlatformSupportedCurrency)
      .map(currencyToPlatformCurrency);
  }, [currencies]);
}

export function useListPlatformCurrencies(): ListPlatformCurrency {
  const currencies = usePlatformCurrencies(true);

  return useCallback(
    (filters?: CurrencyFilters) => {
      return filterPlatformCurrencies(currencies, filters || {});
    },
    [currencies]
  );
}
