import type { InfiniteData } from "@reduxjs/toolkit/query/react";
import type {
  TokensDataWithPagination,
  PageParam,
} from "@ledgerhq/cryptoassets/cal-client/state-manager/types";
import { endpoints as calEndpoints } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { listSupportedCurrencies } from "../../../currencies";
import { currencyToWalletAPICurrency } from "../../converters";
import { isWalletAPISupportedCurrency } from "../../helpers";
import type { WalletAPICurrency } from "../../types";
import type { HandlerDeps } from "../types";

export function createCurrencyListHandler(getDeps: () => HandlerDeps) {
  return async ({ currencyIds }: { currencyIds?: string[] }) => {
    const { manifest, deactivatedCurrencyIds, dispatch } = getDeps();

    const manifestCurrencyIds = manifest.currencies === "*" ? ["**"] : manifest.currencies;

    const queryCurrencyIdsSet = currencyIds ? new Set(currencyIds) : undefined;
    let effectiveCurrencyIds = manifestCurrencyIds;

    if (queryCurrencyIdsSet) {
      effectiveCurrencyIds = manifestCurrencyIds.flatMap(manifestId => {
        if (manifestId === "**") {
          return [...queryCurrencyIdsSet];
        } else if (manifestId.endsWith("/**")) {
          const family = manifestId.slice(0, -3);
          return [...queryCurrencyIdsSet].filter(qId => qId.startsWith(`${family}/`));
        } else if (queryCurrencyIdsSet.has(manifestId)) {
          return [manifestId];
        }
        return [];
      });
    }

    const includeAllCurrencies = effectiveCurrencyIds.includes("**");
    const specificCurrencies = new Set<string>();
    const tokenFamilies = new Set<string>();
    const specificTokenIds = new Set<string>();

    for (const id of effectiveCurrencyIds) {
      if (id === "**") {
        continue;
      } else if (id.endsWith("/**")) {
        const family = id.slice(0, -3);
        tokenFamilies.add(family);
        specificCurrencies.add(family);
      } else if (id.includes("/")) {
        specificTokenIds.add(id);
      } else {
        specificCurrencies.add(id);
      }
    }

    const allCurrencies = listSupportedCurrencies().reduce<WalletAPICurrency[]>((acc, c) => {
      if (isWalletAPISupportedCurrency(c) && !deactivatedCurrencyIds.has(c.id))
        acc.push(currencyToWalletAPICurrency(c));
      return acc;
    }, []);

    let includedCurrencies: WalletAPICurrency[] = [];
    if (includeAllCurrencies) {
      includedCurrencies = allCurrencies;
    } else {
      includedCurrencies = allCurrencies.filter(c => specificCurrencies.has(c.id));
    }

    const specificTokens: WalletAPICurrency[] = [];
    if (specificTokenIds.size > 0) {
      const tokenPromises = [...specificTokenIds].map(async tokenId => {
        const token = await getCryptoAssetsStore().findTokenById(tokenId);
        return token ? currencyToWalletAPICurrency(token) : null;
      });
      const resolvedTokens = await Promise.all(tokenPromises);
      specificTokens.push(...resolvedTokens.filter((t): t is WalletAPICurrency => t !== null));
    }

    const familiesToFetch = new Set<string>();
    if (includeAllCurrencies) {
      allCurrencies.forEach(c => {
        if (c.type === "CryptoCurrency") familiesToFetch.add(c.family);
      });
    } else if (tokenFamilies.size > 0) {
      tokenFamilies.forEach(family => familiesToFetch.add(family));
    }

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

    const result = tokensByFamily.reduce<WalletAPICurrency[]>(
      (acc, tokens) => [...acc, ...tokens.map(t => currencyToWalletAPICurrency(t))],
      [...includedCurrencies, ...specificTokens],
    );

    return result;
  };
}
