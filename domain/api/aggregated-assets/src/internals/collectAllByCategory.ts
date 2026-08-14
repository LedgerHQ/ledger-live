import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import type { RawApiResponse } from "../schema";
import type { GetAssetsByCategoryParams } from "../types";
import { assertDadaApiUrl } from "./utils";
import { resolveBaseUrl } from "./requests";

/**
 * Walks every page of a category and collects one projection per asset.
 *
 * Internal: both public category accessors share it, nothing outside this package should call it.
 */
export async function collectAllByCategory(
  queryArg: GetAssetsByCategoryParams,
  extract: (data: RawApiResponse) => string[],
): Promise<QueryReturnValue<string[], FetchBaseQueryError, FetchBaseQueryMeta | undefined>> {
  try {
    const baseUrl = resolveBaseUrl(queryArg);
    const collected: string[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL(`${baseUrl}/assets`);
      url.searchParams.set("categories", queryArg.category);
      url.searchParams.set("product", queryArg.product);
      url.searchParams.set("pageSize", "100");
      url.searchParams.set("minVersion", queryArg.version);
      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }

      assertDadaApiUrl(url);
      const response = await fetch(url.toString());

      if (!response.ok) {
        return {
          error: {
            status: response.status,
            data: `Failed to fetch assets by category: ${response.statusText}`,
          },
        };
      }

      const data: RawApiResponse = await response.json();
      collected.push(...extract(data));
      cursor = response.headers.get("x-ledger-next") || undefined;
    } while (cursor);

    return { data: collected };
  } catch (error) {
    return {
      error: {
        status: "FETCH_ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
