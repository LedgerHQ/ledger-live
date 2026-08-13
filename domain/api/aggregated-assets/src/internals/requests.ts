import { getEnv } from "@shared/env";
import type {
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import type { RawApiResponse } from "../schema";
import type { AssetsData, GetAssetsDataParams } from "../types";
import { convertApiAssets } from "../transforms";
import { buildAssetsQueryParams } from "../requests";
import { assertDadaApiHost } from "./utils";
import { validateAssetsResponse } from "./validate";

type DadaQueryResult = QueryReturnValue<unknown, FetchBaseQueryError, FetchBaseQueryMeta>;

/**
 * The bound base query RTK hands to `queryFn` as its fourth argument: same fetch, headers and
 * abort signal as a declarative `query`. `PromiseLike` matches RTK's own `MaybePromise`.
 */
export type DadaBaseQuery = (
  arg: string | FetchArgs,
) => DadaQueryResult | PromiseLike<DadaQueryResult>;

/**
 * Picks prod or staging per request.
 *
 * Per-request rather than store config because `isStaging` is derived from the modular-drawer
 * feature flag at each call site, so both environments are reachable in one session.
 */
export function resolveBaseUrl(queryArg: { isStaging?: boolean }): string {
  const baseUrl = queryArg.isStaging ? getEnv("DADA_API_STAGING") : getEnv("DADA_API_PROD");
  assertDadaApiHost(baseUrl);
  return baseUrl;
}

/** One page for one chunk of currency ids, through the base query so aborts and errors behave. */
export async function fetchAssetsPage(
  baseQuery: DadaBaseQuery,
  queryArg: GetAssetsDataParams,
): Promise<AssetsData> {
  const result = await baseQuery({
    url: `${resolveBaseUrl(queryArg)}/assets`,
    params: buildAssetsQueryParams(queryArg),
  });

  if (result.error) throw result.error;

  const raw = validateAssetsResponse(result.data as RawApiResponse);
  return { ...raw, cryptoOrTokenCurrencies: convertApiAssets(raw.cryptoOrTokenCurrencies) };
}
