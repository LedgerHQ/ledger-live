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
  /** Unique identifier for the token */
  id: z.string(),
  /** Smart contract address */
  contract_address: z.string(),
  /** Token standard (e.g., erc20, bep20, spl) */
  standard: z.string(),
  /** Number of decimals */
  decimals: z.number(),
  /** Whether the token is delisted */
  delisted: z.boolean(),
  /** Full name of the token */
  name: z.string(),
  /** Ticker symbol */
  ticker: z.string(),
  /** Array of unit representations */
  units: z.array(TokenUnitSchema).min(1),
  /** Token identifier - Only needed for Cardano native assets to reconstruct full assetId (LIVE-22559) */
  token_identifier: z.string().optional(),
  /** Live signature */
  live_signature: z.string().optional(),
});

export type ApiTokenResponse = z.infer<typeof ApiTokenResponseSchema>;
