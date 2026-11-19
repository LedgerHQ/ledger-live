import { z } from "zod";
import { ApyFractionSchema } from "@domain/entity-earn-position";
import type { SolanaValidatorApyByVoteAccount } from "../types";

// The wire contract of `GET /figment/solana/validators_summary` (Earn OpenAPI `FigmentValidatorAPY`)
// and its mapping. The list must be a list; any entry in it may be malformed and is then dropped.

export const ValidatorsSummaryWireSchema = z.array(z.unknown());

export type ValidatorsSummaryWire = z.infer<typeof ValidatorsSummaryWireSchema>;

const ValidatorApyWireSchema = z.object({
  address: z.string().min(1),
  delegator_apy: ApyFractionSchema,
});

/** `address` is the validator's vote account and `delegator_apy` its APY, as a fraction. */
export function toSolanaValidatorApyByVoteAccount(
  wire: ValidatorsSummaryWire,
): SolanaValidatorApyByVoteAccount {
  return Object.fromEntries(
    wire.flatMap(entry => {
      const validator = ValidatorApyWireSchema.safeParse(entry).data;
      return validator ? [[validator.address, validator.delegator_apy] as const] : [];
    }),
  );
}
