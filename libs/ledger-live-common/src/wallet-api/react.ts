import { useCallback, useMemo, useState, useEffect } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { Observable } from "@ledgerhq/wallet-api-server";
import {
  accountToWalletAPIAccount,
  currencyToWalletAPICurrency,
} from "./converters";
import {
  filterWalletAPIAccounts,
  filterWalletAPICurrencies,
  AccountFilters,
  CurrencyFilters,
} from "./filters";
import { isWalletAPISupportedCurrency } from "./helpers";
import {
  ListWalletAPIAccount,
  ListWalletAPICurrency,
  WalletAPICurrency,
  AppManifest,
  WalletAPIAccount,
} from "./types";
import { getParentAccount } from "../account";
import { listCurrencies } from "../currencies";

/**
 * TODO: we might want to use "searchParams.append" instead of "searchParams.set"
 * to handle duplicated query params (example: "?foo=bar&foo=baz")
 *
 * We can also use the stringify method of qs (https://github.com/ljharb/qs#stringifying)
 */
export function useWalletAPIUrl(
  manifest: AppManifest,
  params: { background?: string; text?: string; loadDate?: Date },
  inputs?: Record<string, string>
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

export function useWalletAPIAccounts(
  accounts: AccountLike[]
): WalletAPIAccount[] {
  return useMemo(() => {
    return accounts.map((account) => {
      const parentAccount = getParentAccount(account, accounts);

      return accountToWalletAPIAccount(account, parentAccount);
    });
  }, [accounts]);
}

export function useListWalletAPIAccounts(
  accounts: AccountLike[]
): ListWalletAPIAccount {
  const walletAPIAccounts = useWalletAPIAccounts(accounts);
  return useCallback(
    (filters: AccountFilters = {}) => {
      return filterWalletAPIAccounts(walletAPIAccounts, filters);
    },
    [walletAPIAccounts]
  );
}

export function useWalletAPICurrencies(): WalletAPICurrency[] {
  return useMemo(
    () =>
      listCurrencies(true)
        .filter(isWalletAPISupportedCurrency)
        .map(currencyToWalletAPICurrency),
    []
  );
}

export function useListWalletAPICurrencies(): ListWalletAPICurrency {
  const currencies = useWalletAPICurrencies();

  return useCallback(
    (filters?: CurrencyFilters) => {
      return filterWalletAPICurrencies(currencies, filters || {});
    },
    [currencies]
  );
}

export function useGetAccountIds(
  accounts$: Observable<WalletAPIAccount[]> | undefined
): Map<string, boolean> | undefined {
  const [accounts, setAccounts] = useState<WalletAPIAccount[]>([]);

  useEffect(() => {
    if (!accounts$) {
      return undefined;
    }

    const subscription = accounts$.subscribe((walletAccounts) => {
      setAccounts(walletAccounts);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [accounts$]);

  return useMemo(() => {
    if (!accounts$) {
      return undefined;
    }

    return accounts.reduce((accountIds, account) => {
      accountIds.set(account.id, true);
      return accountIds;
    }, new Map());
  }, [accounts, accounts$]);
}
