import { z } from "zod";
import { TokenIdSchema, CurrencyIdSchema } from "@shared/schema-primitives";
import { UnitSchema } from "@domain/entity-unit";

/**
 * Canonical Zod-first schema for a token currency entity.
 *
 * @see {@link TokenCurrency} for the inferred TypeScript type.
 */
export const TokenCurrencySchema = z.object({
  /** Discriminant for the currency union — always `"TokenCurrency"`. */
  type: z.literal("TokenCurrency"),
  /** Unique opaque token id (e.g. `"ethereum/erc20/usd-tether"`). */
  id: TokenIdSchema,
  /**
   * Id of the parent crypto currency (e.g. `"ethereum"` for ERC-20 tokens).
   * FK reference — resolved at display time via the crypto-currency registry.
   */
  parentCurrencyId: CurrencyIdSchema,
  /** On-chain contract address (e.g. `"0xdAC17F958D2ee523a2206206994597C13D831ec7"`). */
  contractAddress: z.string(),
  /** Token standard (e.g. `"erc20"`, `"bep20"`, `"trc10"`). */
  tokenType: z.string(),
  /** Human-readable display name (e.g. `"Tether USD"`). */
  name: z.string(),
  /** Ticker used in exchanges and countervalue APIs (e.g. `"USDT"`). */
  ticker: z.string(),
  /**
   * Ordered list of display units. By convention `units[0]` is the default
   * (highest magnitude) unit. Must contain at least one entry.
   */
  units: z.array(UnitSchema).min(1),
  /** When `true`, the token has been delisted and should not appear in new flows. */
  delisted: z.boolean().optional(),
  /** When `true`, countervalue display is disabled. */
  disableCountervalue: z.boolean().optional(),
  /** Ledger's cryptographic signature for the token listing. */
  ledgerSignature: z.string().optional(),
});

/** A token currency entity, inferred from {@link TokenCurrencySchema}. */
export type TokenCurrency = z.infer<typeof TokenCurrencySchema>;
