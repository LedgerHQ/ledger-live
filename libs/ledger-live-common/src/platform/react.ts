import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { InfiniteData } from "@reduxjs/toolkit/query/react";
import { AccountLike } from "@ledgerhq/types-live";
import { makeRe } from "minimatch";
import type {
  TokensDataWithPagination,
  PageParam,
} from "@ledgerhq/cryptoassets/lib/cal-client/state-manager/types";
import { endpoints as calEndpoints } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";
import { accountToPlatformAccount, currencyToPlatformCurrency } from "./converters";
import { filterPlatformAccounts, AccountFilters, CurrencyFilters } from "./filters";
import { isPlatformSupportedCurrency } from "./helpers";
import {
  ListPlatformAccount,
  ListPlatformCurrency,
  PlatformCurrency,
  LiveAppManifest,
  PlatformAccount,
} from "./types";
import { getParentAccount } from "../account";
import { listSupportedCurrencies } from "../currencies";
import { WalletState } from "@ledgerhq/live-wallet/store";

/**
 * TODO: we might want to use "searchParams.append" instead of "searchParams.set"
 * to handle duplicated query params (example: "?foo=bar&foo=baz")
 *
 * We can also use the stringify method of qs (https://github.com/ljharb/qs#stringifying)
 */
export function usePlatformUrl(
  manifest: LiveAppManifest,
  inputs?: Record<string, string | undefined>,
): URL {
  return useMemo(() => {
    const url = new URL(manifest.url.toString());

    if (inputs) {
      for (const key in inputs) {
        const value = inputs[key];
        if (Object.prototype.hasOwnProperty.call(inputs, key) && value !== undefined) {
          url.searchParams.set(key, value);
        }
      }
    }

    if (manifest.params) {
      url.searchParams.set("params", JSON.stringify(manifest.params));
    }

    return url;
  }, [manifest.url, manifest.params, inputs]);
}

export function usePlatformAccounts(
  walletState: WalletState,
  accounts: AccountLike[],
): PlatformAccount[] {
  return useMemo(() => {
    return accounts.map(account => {
      const parentAccount = getParentAccount(account, accounts);

      return accountToPlatformAccount(walletState, account, parentAccount);
    });
  }, [walletState, accounts]);
}

export function useListPlatformAccounts(
  walletState: WalletState,
  accounts: AccountLike[],
): ListPlatformAccount {
  const platformAccounts = usePlatformAccounts(walletState, accounts);
  return useCallback(
    (filters: AccountFilters = {}) => {
      return filterPlatformAccounts(platformAccounts, filters);
    },
    [platformAccounts],
  );
}

export function useListPlatformCurrencies(
  deactivatedCurrencyIds: Set<string>,
): ListPlatformCurrency {
  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>();

  return useCallback(
    async (filters?: CurrencyFilters) => {
      const filterCurrencyRegexes = filters?.currencies
        ? filters.currencies.map(filter => makeRe(filter))
        : null;

      // 1. Gather all supported parent currencies
      const allCurrencies = listSupportedCurrencies().reduce<PlatformCurrency[]>((acc, c) => {
        if (isPlatformSupportedCurrency(c) && !deactivatedCurrencyIds.has(c.id))
          acc.push(currencyToPlatformCurrency(c));
        return acc;
      }, []);

      // 2. Determine which currencies to include based on patterns
      let includedCurrencies: PlatformCurrency[] = allCurrencies;
      if (filterCurrencyRegexes) {
        includedCurrencies = allCurrencies.filter(c => {
          if (filterCurrencyRegexes && !filterCurrencyRegexes.some(regex => c.id.match(regex))) {
            return false;
          }
          return true;
        });
      }

      if (filters?.includeTokens === false) {
        return includedCurrencies;
      }

      // 3. Determine which token families to fetch (only if not already fetched as specific tokens)
      const familiesToFetch = new Set<string>();
      includedCurrencies.forEach(c => {
        if (c.type === "CryptoCurrency") familiesToFetch.add(c.family);
      });

      // 4. Fetch tokens for relevant families
      const fetchAllPagesForFamily = async (family: string) => {
        const args = { networkFamily: family, pageSize: 1000 };
        let hasNextPage = true;
        let data: InfiniteData<TokensDataWithPagination, PageParam> | undefined;

        while (hasNextPage) {
          const querySub = dispatch(
            calEndpoints.getTokensData.initiate(args, data ? { direction: "forward" } : undefined),
          );

          try {
            const result = await querySub;
            data = result.data;
            hasNextPage = result.hasNextPage;
            if (result.error) throw result.error;
          } finally {
            querySub.unsubscribe();
          }
        }

        return (data?.pages ?? []).flatMap(p => p.tokens);
      };

      const tokensByFamily = await Promise.all(
        [...familiesToFetch].map(f => fetchAllPagesForFamily(f)),
      );

      // 5. Combine all results
      return tokensByFamily.reduce<PlatformCurrency[]>((acc, tokens) => {
        return tokens.reduce<PlatformCurrency[]>((tAcc, t) => {
          const pc = currencyToPlatformCurrency(t);
          if (!filterCurrencyRegexes || filterCurrencyRegexes.some(r => pc.id.match(r))) {
            tAcc.push(pc);
          }
          return tAcc;
        }, acc);
      }, includedCurrencies);
    },
    [deactivatedCurrencyIds, dispatch],
  );
}
