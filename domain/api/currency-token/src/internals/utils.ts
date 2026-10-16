import type { FetchBaseQueryMeta } from "@reduxjs/toolkit/query/react";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { ApiResponseSchema } from "../schema";
import { convertApiToken } from "../converter";
import type {
  ApiTokenResponse,
  TokenByTokenIdentifierInCurrencyParams,
  TokensDataWithPagination,
} from "../types";
import { HEADER_X_LEDGER_NEXT } from "./constants";

/** Maps a paginated CAL token response to {@link TokenCurrency} entities + the next-page cursor. */
export function transformTokensResponse(
  response: ApiTokenResponse[],
  meta?: FetchBaseQueryMeta,
): TokensDataWithPagination {
  const nextCursor = meta?.response?.headers.get(HEADER_X_LEDGER_NEXT) ?? undefined;

  return {
    tokens: response.flatMap(token => {
      const result = transformApiTokenToTokenCurrency(token);
      return result ? [result] : [];
    }),
    pagination: nextCursor ? { nextCursor } : {},
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
    delisted: token.delisted,
    ...(token.token_identifier !== undefined ? { tokenIdentifier: token.token_identifier } : {}),
    ...(token.live_signature !== undefined ? { ledgerSignature: token.live_signature } : {}),
  });
}

/** Validates a single-token CAL response (`[token]`) and converts the first entry. */
export function validateAndTransformSingleTokenResponse(
  response: unknown,
): TokenCurrency | undefined {
  if (response === undefined || response === null) {
    return undefined;
  }
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
    delisted: apiToken.delisted,
    ...(apiToken.token_identifier !== undefined
      ? { tokenIdentifier: apiToken.token_identifier }
      : {}),
    ...(apiToken.live_signature !== undefined ? { ledgerSignature: apiToken.live_signature } : {}),
  });
}

/**
 * Validates a `token_identifier` lookup response and converts its only entry. Throws when CAL
 * returned more than one match: a token_identifier is unique per contract, not per network on every
 * chain, and picking one of several matches would silently resolve to the wrong token.
 */
export function validateAndTransformTokenIdentifierResponse(
  response: unknown,
  params: TokenByTokenIdentifierInCurrencyParams,
): TokenCurrency | undefined {
  if (response === undefined || response === null) {
    return undefined;
  }
  const apiTokens = ApiResponseSchema.parse(response);
  if (apiTokens.length > 1) {
    const ids = apiTokens.map(token => token.id).join(", ");
    throw new Error(
      `token_identifier "${params.token_identifier}" matches several ${params.network} tokens: ${ids}`,
    );
  }
  const apiToken = apiTokens[0];
  return apiToken ? transformApiTokenToTokenCurrency(apiToken) : undefined;
}
