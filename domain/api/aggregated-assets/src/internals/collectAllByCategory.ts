import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import type { RawApiResponse } from "../schema";
import type { GetAssetsByCategoryParams } from "../types";
import { resolveBaseUrl, type DadaBaseQuery } from "./requests";

/**
 * Collects one projection per asset across every page of a category.
 *
 * Ends on a repeated cursor, which is what a proxy echoing `x-ledger-next` produces. Deliberately
 * still unbounded if the server keeps minting new ones: Cloudflare fronts DADA, so a page cap was
 * judged not worth the ceiling it would put on how large a category may grow.
 */
export async function collectAllByCategory(
  queryArg: GetAssetsByCategoryParams,
  baseQuery: DadaBaseQuery,
  extract: (data: RawApiResponse) => string[],
): Promise<QueryReturnValue<string[], FetchBaseQueryError, FetchBaseQueryMeta>> {
  /* The host guard throws, and a rejected queryFn surfaces in RTK as an unhandled error. */
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

    const nextCursor = result.meta?.response?.headers.get("x-ledger-next") || undefined;

    /* Same cursor back means no further pages, so this is success rather than an error. */
    if (nextCursor !== undefined && nextCursor === cursor) return { data: collected };

    cursor = nextCursor;
  } while (cursor);

  return { data: collected };
}
