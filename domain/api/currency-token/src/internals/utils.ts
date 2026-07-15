import type { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { ApiResponseSchema } from "../schema";
import { convertApiToken } from "../converter";
import type { ApiTokenResponse, TokensDataWithPagination } from "../types";
import { HEADER_X_LEDGER_NEXT } from "./constants";

/** Maps a paginated CAL token response to {@link TokenCurrency} entities + the next-page cursor. */
export function transformTokensResponse(
  response: ApiTokenResponse[],
  meta?: FetchBaseQueryMeta,
): TokensDataWithPagination {
  const nextCursor = meta?.response?.headers.get(HEADER_X_LEDGER_NEXT) || undefined;

  return {
    tokens: response.flatMap(token => {
      const result = transformApiTokenToTokenCurrency(token);
      return result ? [result] : [];
    }),
    pagination: { nextCursor },
  };
}

/** Maps a single raw CAL token to a {@link TokenCurrency} (or `undefined` if unconvertible). */
export function transformApiTokenToTokenCurrency(
  token: ApiTokenResponse,
): TokenCurrency | undefined {
  return convertApiToken({
    id: token.id,
    contractAddress: token.contract_address,
    name: token.name,
    ticker: token.ticker,
    units: token.units,
    standard: token.standard,
    tokenIdentifier: token.token_identifier,
    delisted: token.delisted,
    ledgerSignature: token.live_signature,
  });
}

/** Validates a single-token CAL response (`[token]`) and converts the first entry. */
export function validateAndTransformSingleTokenResponse(
  response: unknown,
): TokenCurrency | undefined {
  const validatedResponse = ApiResponseSchema.parse(response);
  const apiToken = validatedResponse[0];
  if (!apiToken) {
    return undefined;
  }
  return convertApiToken({
    id: apiToken.id,
    contractAddress: apiToken.contract_address,
    name: apiToken.name,
    ticker: apiToken.ticker,
    units: apiToken.units,
    standard: apiToken.standard,
    tokenIdentifier: apiToken.token_identifier,
    delisted: apiToken.delisted,
    ledgerSignature: apiToken.live_signature,
  });
}
