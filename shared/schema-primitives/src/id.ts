import { z } from "zod";

/**
 * Identifier of a wallet account, main or token alike.
 *
 * Opaque on purpose: the encoding (`js:2:ethereum:0xabc…:`, `js:2:ethereum:0xabc…:+ethereum%2Ferc20%2Fusdc`)
 * belongs to the account layer, and nothing that merely keys data by account should have to know it.
 * Branded so an account id cannot be passed where a currency id, an address or a raw string is expected.
 */
export const AccountIdSchema = z.string().min(1).brand<"AccountId">();

export type AccountId = z.infer<typeof AccountIdSchema>;
