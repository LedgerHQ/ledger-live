import { getEnv } from "@shared/env";
import type { RawApiResponse } from "./schema";
import { AssetsAdditionalData, type AssetsData, type GetAssetsDataParams } from "./types";
import { convertApiAssets } from "./transforms";
import { assertDadaApiUrl } from "./internals/assertDadaApiUrl";

export function buildAssetsQueryParams(
  queryArg: GetAssetsDataParams,
  opts?: { pageSize?: number; cursor?: string },
): Record<string, unknown> {
  return {
    pageSize: opts?.pageSize ?? 100,
    ...(opts?.cursor && { cursor: opts.cursor }),
    ...(queryArg.useCase && { transaction: queryArg.useCase }),
    ...(queryArg.currencyIds &&
      queryArg.currencyIds.length > 0 && {
        currencyIds: queryArg.currencyIds,
      }),
    ...(queryArg.networkIds &&
      queryArg.networkIds.length > 0 && {
        networkIds: queryArg.networkIds.join(","),
      }),
    ...(queryArg.categories &&
      queryArg.categories.length > 0 && {
        categories: queryArg.categories.join(","),
      }),
    ...(queryArg.search && { search: queryArg.search }),
    product: queryArg.product,
    minVersion: queryArg.version,
    ...(queryArg.includeTestNetworks && { includeTestNetworks: queryArg.includeTestNetworks }),
    additionalData: queryArg.additionalData || [
      AssetsAdditionalData.Apy,
      AssetsAdditionalData.MarketTrend,
    ],
  };
}

export function resolveBaseUrl(queryArg: { isStaging?: boolean }): string {
  return queryArg.isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");
}

/** One page for one chunk of currency ids. Used by the chunked lookup endpoint. */
export async function fetchAssetsPage(
  baseUrl: string,
  queryArg: GetAssetsDataParams,
): Promise<AssetsData> {
  const params = buildAssetsQueryParams(queryArg);
  const url = new URL(`${baseUrl}/assets`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
  }

  assertDadaApiUrl(url);
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`DADA fetch failed: ${response.status} ${response.statusText}`);
  }

  const raw: RawApiResponse = await response.json();
  const enrichedCryptoOrTokenCurrencies = convertApiAssets(raw.cryptoOrTokenCurrencies);

  return {
    ...raw,
    cryptoOrTokenCurrencies: enrichedCryptoOrTokenCurrencies,
  };
}
