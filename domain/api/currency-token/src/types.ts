import { z } from "zod";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { ApiTokenResponseSchema, PersistedCALSchema, PersistedTokenEntrySchema } from "./schema";

export interface TokenByIdParams {
  id: string;
}

/** Parameters for the `findTokenByAddressInCurrency` query. */
export interface TokenByAddressInCurrencyParams {
  /** The contract address of the token. */
  contract_address: string;
  /** The network of the token. */
  network: string;
  /** The token identifier. */
  token_identifier?: string;
}

/** Parameters for the `getTokensData` query. */
export interface GetTokensDataParams {
  /** Filter by network family (e.g. "ethereum", "polygon"). */
  networkFamily?: string;
  /** Output fields to request (defaults to the full token-schema projection). */
  output?: string[];
  /** Maximum number of assets to return. */
  limit?: number;
  /** Items per page (default 1000). */
  pageSize?: number;
  /** CAL reference to read from (e.g. "branch:main", "tag:tokens-1.11.12"). */
  ref?: string;
}

/** Parameters for pagination. */
export interface PageParam {
  /** Cursor for the next page of results. */
  cursor?: string;
}

/** Response data for the `getTokensData` query, including pagination. */
export interface TokensDataWithPagination {
  /** The list of token currencies. */
  tokens: TokenCurrency[];
  pagination: TokenPagination;
}

/** Pagination metadata returned with `getTokensData` responses. */
export interface TokenPagination {
  /** Cursor for the next page of results. */
  nextCursor?: string;
}

/** A single token in the CAL `/v1/tokens` response (inferred from {@link ApiTokenResponseSchema}). */
export type ApiTokenResponse = z.infer<typeof ApiTokenResponseSchema>;

/** A persisted token entry: a {@link TokenCurrency} plus cache-restoration metadata. */
export type PersistedTokenEntry = z.infer<typeof PersistedTokenEntrySchema>;

/** The root persisted CAL blob (version pin + token entries + optional hash map). */
export type PersistedCAL = z.infer<typeof PersistedCALSchema>;
