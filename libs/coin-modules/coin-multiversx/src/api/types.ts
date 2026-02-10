import type { Api, MemoNotSupported, TxDataNotSupported } from "@ledgerhq/coin-framework/api/types";

/**
 * MultiversX API configuration options.
 *
 * Note: `createApi()` resolves defaults from `@ledgerhq/live-env`:
 * - `MULTIVERSX_API_ENDPOINT`
 * - `MULTIVERSX_DELEGATION_API_ENDPOINT`
 */
export interface MultiversXApiConfig {
  /** MultiversX API endpoint override. */
  apiEndpoint?: string;
  /** Delegation API endpoint override. */
  delegationApiEndpoint?: string;
}

/**
 * MultiversX API type implementing the Alpaca API interface.
 * Uses MemoNotSupported since MultiversX doesn't support transaction memos.
 * Uses TxDataNotSupported since MultiversX doesn't support computational payloads.
 */
export type MultiversXApi = Api<MemoNotSupported, TxDataNotSupported>;
