import { z } from "zod";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import { UnitSchema } from "@domain/entity-currency-unit";
import { PERSISTENCE_VERSION } from "./internals/constants";

/** Schema for a single token in the CAL `/v1/tokens` response. */
export const ApiTokenResponseSchema = z.object({
  id: z.string(),
  contract_address: z.string(),
  standard: z.string(),
  decimals: z.number(),
  delisted: z.boolean(),
  name: z.string(),
  ticker: z.string(),
  units: z.array(UnitSchema).min(1),
  /** Only present for Cardano native assets, used to reconstruct the full assetId. */
  token_identifier: z.string().optional(),
  live_signature: z.string().optional(),
});

/** Schema for the CAL `/v1/tokens` response: an array of tokens. */
export const ApiResponseSchema = z.array(ApiTokenResponseSchema);

/** Schema for a persisted token entry: a {@link TokenCurrency} plus cache-restoration metadata. */
export const PersistedTokenEntrySchema = z.object({
  /** Serializable token data (post-LIVE-32268 `TokenCurrency` is already serializable). */
  data: TokenCurrencySchema,
  /** When this token was fetched (Unix timestamp in ms). */
  timestamp: z.number(),
  /**
   * The `token_identifier` used in the `findTokenByAddressInCurrency` query, if any.
   * Needed to reconstruct the correct RTK Query cache key on hydration for chains where
   * `contract_address` alone is not unique (e.g. MultiversX, Algorand, Cardano).
   */
  token_identifier: z.string().optional(),
});

/** Schema for the root persisted CAL blob, with a version pin and an optional hash map. */
export const PersistedCALSchema = z.object({
  /** The persistence version of the CAL blob. Used to determine compatibility with the current schema. */
  version: z.literal(PERSISTENCE_VERSION),
  /** The persisted token entries. */
  tokens: z.array(PersistedTokenEntrySchema),
  /** Mapping of currencyId to its `X-Ledger-Commit` hash. */
  hashes: z.record(z.string(), z.string()).optional(),
});

/**
 * Thunk `extraArgument` contract for the CAL token api. The app supplies the resolved CAL service
 * URL, client version and an optional logger at store configuration time, so this package owns no
 * env/config/logging dependency. The app picks the prod or staging URL — there is no staging switch
 * in here.
 */
export const CalApiExtraSchema = z.object({
  calServiceUrl: z.string().min(1),
  ledgerClientVersion: z.string().min(1),
  logger: z.custom<(...args: unknown[]) => void>().optional(),
});
