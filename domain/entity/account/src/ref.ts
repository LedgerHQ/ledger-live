import { z } from "zod";
import { AccountIdSchema } from "./schema";

/**
 * What it takes to ask any source about an account without holding the account itself: derivable
 * from a Ledger Sync descriptor that was never synced.
 */
export const AccountRefSchema = z.object({
  accountId: AccountIdSchema,
  currencyId: z.string().min(1),
  address: z.string().min(1),
  derivationMode: z.string(),
});
export type AccountRef = z.infer<typeof AccountRefSchema>;

/** Identity of a ref: two refs with the same key ask the same question. */
export function accountRefKey(ref: AccountRef): string {
  return [ref.accountId, ref.currencyId, ref.address, ref.derivationMode].join("|");
}
