import { z } from "zod";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { AccountIdSchema } from "./legacy/schema";
import { AccountUUIDSchema } from "./accountUUID";

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

/** An account only known remotely, or generated: no legacy account backs it. */
export type RemoteAccountEntry = Omit<AccountEntry, "legacyId">;

export const AccountsStateSchema = z.object({
  /** The accounts, in the user's order. */
  ids: z.array(AccountUUIDSchema),
  entities: z.record(AccountUUIDSchema, AccountEntrySchema),
  byLegacyId: z.partialRecord(AccountIdSchema, AccountUUIDSchema),
});

export type AccountsState = z.infer<typeof AccountsStateSchema>;

export const initialAccountsState: AccountsState = { ids: [], entities: {}, byLegacyId: {} };

/** An account discovery found and the user has not added: its descriptor only, so its data can be read. */
export type DiscoveredAccountEntry = Pick<AccountEntry, "accountUUID" | "descriptor">;

export const DiscoveredAccountsStateSchema = z.partialRecord(
  AccountUUIDSchema,
  AccountDescriptorSchema,
);

export type DiscoveredAccountsState = z.infer<typeof DiscoveredAccountsStateSchema>;

export const initialDiscoveredAccountsState: DiscoveredAccountsState = {};
