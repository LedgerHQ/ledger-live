import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { InfiniteData } from "@reduxjs/toolkit/query";
import type { Currency as WalletAPICurrency } from "@ledgerhq/wallet-api-core";
import {
  cryptoAssetsApi,
  type PageParam,
  type TokensDataWithPagination,
} from "@domain/api-currency-token";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { effectiveCurrencyIds, type ManifestCurrencies } from "./manifestCurrencies";
import { currencyToWalletAPICurrency } from "./walletApiCurrencies";

/**
 * Max parallel CAL token lookups: CAL has no bulk id lookup, and unbounded fan-out exhausts the
 * connection pool so lookups fail silently. Raising it does not make the call faster (QAA-1497).
 */
export const TOKEN_LOOKUP_CONCURRENCY = 10;

// oxlint-disable-next-line typescript/no-explicit-any
type Dispatch = ThunkDispatch<any, unknown, UnknownAction>;

/** Runs `run` on every item, at most `limit` at a time, keeping the order. */
async function withConcurrency<T, R>(limit: number, items: T[], run: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function tokensOfFamily(dispatch: Dispatch, family: string) {
  const args = { networkFamily: family, pageSize: 1000 };
  let hasNextPage = true;
  let data: InfiniteData<TokensDataWithPagination, PageParam> | undefined;
  while (hasNextPage) {
    const request = dispatch(
      cryptoAssetsApi.endpoints.getTokensData.initiate(
        args,
        data ? { direction: "forward" } : undefined,
      ),
    );
    try {
      const result = await request;
      data = result.data;
      hasNextPage = result.hasNextPage;
      if (result.error) throw result.error;
    } finally {
      request.unsubscribe();
    }
  }
  return (data?.pages ?? []).flatMap(page => page.tokens);
}

export type WalletAPICurrenciesRequest = {
  manifestCurrencies: ManifestCurrencies;
  currencyIds?: string[];
  /** The crypto currencies this build supports and the Wallet API can serve. */
  supportedCurrencies: CryptoCurrency[];
  findTokenById: (id: string) => Promise<TokenCurrency | undefined | null>;
};

/** The currencies a live app may see: the manifest patterns, narrowed to the query, tokens from CAL. */
export function fetchWalletAPICurrencies({
  manifestCurrencies,
  currencyIds,
  supportedCurrencies,
  findTokenById,
}: WalletAPICurrenciesRequest) {
  return async (dispatch: Dispatch): Promise<WalletAPICurrency[]> => {
    const effectiveIds = effectiveCurrencyIds(manifestCurrencies, currencyIds);
    const includeAll = effectiveIds.includes("**");
    const specificCurrencies = new Set<string>();
    const tokenFamilies = new Set<string>();
    const specificTokenIds = new Set<string>();
    for (const id of effectiveIds) {
      if (id === "**") continue;
      if (id.endsWith("/**")) {
        const family = id.slice(0, -3);
        tokenFamilies.add(family);
        specificCurrencies.add(family);
      } else if (id.includes("/")) {
        specificTokenIds.add(id);
      } else {
        specificCurrencies.add(id);
      }
    }

    const all = supportedCurrencies.map(currencyToWalletAPICurrency);
    const included = includeAll ? all : all.filter(c => specificCurrencies.has(c.id));

    const findToken = async (id: string) => {
      try {
        const token = await findTokenById(id);
        return token ? currencyToWalletAPICurrency(token) : null;
      } catch {
        return null;
      }
    };
    const tokens = (
      await withConcurrency(TOKEN_LOOKUP_CONCURRENCY, [...specificTokenIds], findToken)
    ).filter((token): token is WalletAPICurrency => token !== null);

    const families = new Set<string>(tokenFamilies);
    if (includeAll) {
      for (const currency of all)
        if (currency.type === "CryptoCurrency") families.add(currency.family);
    }
    const tokensByFamily = await Promise.all(
      [...families].map(family => tokensOfFamily(dispatch, family)),
    );

    return [
      ...included,
      ...tokens,
      ...tokensByFamily.flat().map(token => currencyToWalletAPICurrency(token)),
    ];
  };
}
