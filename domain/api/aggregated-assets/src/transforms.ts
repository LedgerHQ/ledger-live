import type { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import { CryptoCurrencyIdSchema, findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { convertApiToken } from "@domain/api-currency-token";
import type { ApiAsset, RawApiResponse } from "./schema";
import type { AssetsDataWithPagination } from "./types";

/**
 * Converts the wire currency map to app currencies.
 *
 * Deliberately lenient, and load-bearing: a token whose parent chain is unknown is silently
 * dropped, and a crypto missing from the local registry is *synthesised* rather than dropped, so
 * assets DADA knows about but the CAL does not still render. Do not tighten without replacing
 * that behaviour.
 */
export function convertApiAssets(
  apiAssets: Record<string, ApiAsset>,
): Record<string, CryptoOrTokenCurrency> {
  const result: Record<string, CryptoOrTokenCurrency> = {};
  for (const [key, asset] of Object.entries(apiAssets)) {
    if (asset.type === "token_currency") {
      const token = convertApiToken(asset as Parameters<typeof convertApiToken>[0]);
      if (token) result[key] = token;
    } else {
      const crypto = findCryptoCurrencyById(asset.id);
      if (crypto) {
        result[key] = crypto;
      } else {
        result[key] = {
          type: "CryptoCurrency" as const,
          id: CryptoCurrencyIdSchema.parse(asset.id),
          name: asset.name,
          ticker: asset.ticker,
          units: asset.units,
          managerAppName: asset.name,
          coinType: asset.coinType ?? 0,
          scheme: asset.id.toLowerCase(),
          color: "#999999",
          family: asset.family ?? asset.id,
          explorerViews: [],
          symbol: asset.symbol,
          disableCountervalue: asset.disableCountervalue,
          supportsSegwit: asset.hasSegwit,
          ...(asset.chainId ? { ethereumLikeInfo: { chainId: parseInt(asset.chainId, 10) } } : {}),
        };
      }
    }
  }
  return result;
}

export function transformAssetsResponse(
  response: RawApiResponse,
  meta?: FetchBaseQueryMeta,
): AssetsDataWithPagination {
  const enrichedCryptoOrTokenCurrencies = convertApiAssets(response.cryptoOrTokenCurrencies);

  const nextCursor = meta?.response?.headers.get("x-ledger-next") || undefined;

  return {
    ...response,
    cryptoOrTokenCurrencies: enrichedCryptoOrTokenCurrencies,
    pagination: {
      nextCursor,
    },
  };
}
