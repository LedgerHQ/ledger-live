import { z } from "zod";

/** The id of a trustchain member, as the Ledger Sync SDK lists it. */
export const TrustchainMemberId = z.string().brand<"TrustchainMemberId">();
export type TrustchainMemberId = z.infer<typeof TrustchainMemberId>;
