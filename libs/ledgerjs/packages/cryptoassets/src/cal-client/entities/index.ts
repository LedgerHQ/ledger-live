import { z } from "zod";

/**
 * Zod schema for token unit
 */
export const TokenUnitSchema = z.object({
  /** Code identifier for the unit */
  code: z.string(),
  /** Display name of the unit */
  name: z.string(),
  /** Magnitude (number of decimals) */
  magnitude: z.number(),
});

export type TokenUnit = z.infer<typeof TokenUnitSchema>;

/**
 * Zod schema for API token response
 */
export const ApiTokenResponseSchema = z.object({
  /** Type of asset (token or currency) */
  type: z.string(),
  /** Unique identifier for the token */
  id: z.string(),
  /** Smart contract address */
  contract_address: z.string(),
  /** Token standard (e.g., erc20, bep20, spl) */
  standard: z.string(),
  /** Number of decimals */
  decimals: z.number(),
  /** Network identifier (e.g., arbitrum, ethereum) */
  network: z.string(),
  /** Network family (e.g., ethereum, solana) */
  network_family: z.string(),
  /** Whether the token is delisted */
  delisted: z.boolean(),
  /** Full name of the token */
  name: z.string(),
  /** Ticker symbol */
  ticker: z.string(),
  /** Array of unit representations */
  units: z.array(TokenUnitSchema).min(1),
  /** Symbol */
  symbol: z.string(),
  /** Chain ID */
  chain_id: z.string(),
  /** Token identifier */
  token_identifier: z.string(),
  /** Network type */
  network_type: z.string(),
  /** Meta currency ID */
  meta_currency_id: z.string(),
  /** Blockchain name */
  blockchain_name: z.string(),
  /** Live signature */
  live_signature: z.string(),
});

export type ApiTokenResponse = z.infer<typeof ApiTokenResponseSchema>;
