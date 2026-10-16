import { z } from "zod";
import { AccountDescriptorSchema, AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { AccountIdSchema } from "./legacy/schema";

export const AccountEntrySchema = z.object({
  accountUUID: AccountUUIDSchema,
  descriptor: AccountDescriptorSchema,
  /** Absent for an account that only exists remotely. */
  legacyId: AccountIdSchema.optional(),
});

export type AccountEntry = z.infer<typeof AccountEntrySchema>;

/** An account the legacy store holds. */
export const LegacyAccountEntrySchema = AccountEntrySchema.required({ legacyId: true });

export type LegacyAccountEntry = z.infer<typeof LegacyAccountEntrySchema>;

export const AccountsStateSchema = z.object({
  /** The accounts, in the user's order. */
  ids: z.array(AccountUUIDSchema),
  entities: z.record(AccountUUIDSchema, AccountEntrySchema),
  byLegacyId: z.partialRecord(AccountIdSchema, AccountUUIDSchema),
});

export type AccountsState = z.infer<typeof AccountsStateSchema>;

export const initialAccountsState: AccountsState = { ids: [], entities: {}, byLegacyId: {} };
