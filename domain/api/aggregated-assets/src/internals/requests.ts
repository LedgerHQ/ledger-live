import { getEnv } from "@shared/env";
import type { RawApiResponse } from "../schema";
import type { AssetsData, GetAssetsDataParams } from "../types";
import { convertApiAssets } from "../transforms";
import { buildAssetsQueryParams } from "../requests";
import { assertDadaApiUrl } from "./utils";

/**
 * Picks prod or staging per request.
 *
 * Exists only because the shared DADA base query is configured with `baseUrl: ""`, so every
 * endpoint has to resolve its own absolute url. LIVE-35301 moves url ownership to
 * `@shared/api-services` via `extraArgument`, which removes the need for this.
 */
export function resolveBaseUrl(queryArg: { isStaging?: boolean }): string {
  return queryArg.isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");
}

/**
 * One page for one chunk of currency ids. Used by the chunked lookup endpoint.
 *
 * Hand-rolls `fetch` instead of going through the base query, which is why `assertDadaApiUrl` is
 * needed and why RTK's `AbortSignal` never reaches the request. `queryFn` receives `baseQuery` as
 * its fourth argument, so the fan-out could use it — see LIVE-35301.
 */
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
