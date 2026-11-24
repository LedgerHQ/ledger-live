import { z } from "zod";
import { AccountIdSchema } from "./legacy/schema";
import { AccountUUIDSchema } from "./accountUUID";
import { AccountEntrySchema } from "./entry";

export const AccountsStateSchema = z.object({
  /** The accounts, in the user's order. */
  ids: z.array(AccountUUIDSchema),
  entities: z.record(AccountUUIDSchema, AccountEntrySchema),
  byLegacyId: z.partialRecord(AccountIdSchema, AccountUUIDSchema),
});

export type AccountsState = z.infer<typeof AccountsStateSchema>;

export const initialAccountsState: AccountsState = { ids: [], entities: {}, byLegacyId: {} };
