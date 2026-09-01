import { z } from "zod";

/**
 * Identifier of a wallet account, main or token alike.
 *
 * Opaque on purpose: the encoding (`js:2:ethereum:0xabc…:`, `js:2:ethereum:0xabc…:+ethereum%2Ferc20%2Fusdc`)
 * belongs to the account layer, and nothing that merely keys data by account should have to know it.
 * Branded so an account id cannot be passed where a currency id, an address or a raw string is expected.
 *
 * Blank ids are rejected rather than trimmed: an account id keys persisted tables, so parsing must
 * hand back the very string the caller indexed by, never a normalised variant of it.
 */
export const AccountIdSchema = z
  .string()
  .min(1)
  .regex(/\S/, "Expected an account id, not blank space")
  .brand<"AccountId">();

export type AccountId = z.infer<typeof AccountIdSchema>;
