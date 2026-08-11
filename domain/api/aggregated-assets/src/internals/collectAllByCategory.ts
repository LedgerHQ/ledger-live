import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import type { RawApiResponse } from "../schema";
import type { GetAssetsByCategoryParams } from "../types";
import { resolveBaseUrl, type DadaBaseQuery } from "./requests";

/**
 * Walks every page of a category and collects one projection per asset.
 *
 * Internal: both public category accessors share it, nothing outside this package should call it.
 * TODO(LIVE-35503): the walk is unbounded and only stops when the server clears the cursor.
 */
export async function collectAllByCategory(
  queryArg: GetAssetsByCategoryParams,
  baseQuery: DadaBaseQuery,
  extract: (data: RawApiResponse) => string[],
): Promise<QueryReturnValue<string[], FetchBaseQueryError, FetchBaseQueryMeta>> {
  /*
   * The host guard throws, and a rejected queryFn surfaces in RTK as an unhandled error. Convert it
   * so no path out of this endpoint can throw — LIVE-35232 depends on that.
   */
  let baseUrl: string;
  try {
    baseUrl = resolveBaseUrl(queryArg);
  } catch (error) {
    return {
      error: {
        status: "CUSTOM_ERROR",
        error: error instanceof Error ? error.message : "Unresolvable DADA base url",
      },
    };
  }

  const collected: string[] = [];
  let cursor: string | undefined;

  do {
    const result = await baseQuery({
      url: `${baseUrl}/assets`,
      params: {
        categories: queryArg.category,
        product: queryArg.product,
        pageSize: 100,
        minVersion: queryArg.version,
        ...(cursor && { cursor }),
      },
    });

    if (result.error) return { error: result.error };

    collected.push(...extract(result.data as RawApiResponse));
    cursor = result.meta?.response?.headers.get("x-ledger-next") || undefined;
  } while (cursor);

  return { data: collected };
}
