import { useCallback, useMemo } from "react";
import { AccountLike } from "@ledgerhq/types-live";
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
import { listCurrencies } from "../currencies";

/**
 * TODO: we might want to use "searchParams.append" instead of "searchParams.set"
 * to handle duplicated query params (example: "?foo=bar&foo=baz")
 *
 * We can also use the stringify method of qs (https://github.com/ljharb/qs#stringifying)
 */
export function usePlatformUrl(
  manifest: AppManifest,
  params: { background: string; text: string; loadDate?: Date },
  inputs: Record<string, string>
): URL {
  return useMemo(() => {
    const url = new URL(manifest.url.toString());

    if (inputs) {
      for (const key in inputs) {
        if (
          Object.prototype.hasOwnProperty.call(inputs, key) &&
          inputs[key] !== undefined
        ) {
          url.searchParams.set(key, inputs[key]);
        }
      }
    }

    if (params.background)
      url.searchParams.set("backgroundColor", params.background);
    if (params.text) url.searchParams.set("textColor", params.text);
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
  const platformAccounts = useMemo(() => {
    return accounts.map((account) => {
      const parentAccount = getParentAccount(account, accounts);

      return accountToPlatformAccount(account, parentAccount);
    });
  }, [accounts]);

  return useCallback(
    (filters: AccountFilters = {}) => {
      return filterPlatformAccounts(platformAccounts, filters);
    },
    [platformAccounts]
  );
}

export function usePlatformCurrencies(
  includeTokens = false
): PlatformCurrency[] {
  return useMemo(
    () =>
      listCurrencies(includeTokens)
        .filter(isPlatformSupportedCurrency)
        .map(currencyToPlatformCurrency),
    [includeTokens]
  );
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
