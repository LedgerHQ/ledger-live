import { z } from "zod";
import type { AccountDataResult } from "@domain/entity-account-data";

/** Whether an account has any history on chain: one operation, or a non-zero balance of any asset. */
export const AccountExistenceSchema = z.object({ used: z.boolean() });

export type AccountExistence = z.infer<typeof AccountExistenceSchema>;

/** What a source answers for the kind, as the router types it. */
export type AccountExistenceResult = AccountDataResult<"existence">;

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    /** Asked by discovery for accounts the app does not hold yet: a source answers it however is cheapest. */
    existence: { query: undefined; result: AccountExistence };
  }
}
