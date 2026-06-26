import { z } from "zod";
import { UnitSchema } from "@domain/entity-currency-unit";

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

export type ApiTokenResponse = z.infer<typeof ApiTokenResponseSchema>;

/** Schema for the CAL `/v1/tokens` response: an array of tokens. */
export const ApiResponseSchema = z.array(ApiTokenResponseSchema);
