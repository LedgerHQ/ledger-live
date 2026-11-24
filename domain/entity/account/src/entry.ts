import { z } from "zod";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { AccountUUIDSchema } from "./accountUUID";
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

/** An account only known remotely, or generated: no legacy account backs it. */
export type RemoteAccountEntry = Omit<AccountEntry, "legacyId">;
