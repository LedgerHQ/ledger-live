import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { AccountEntrySchema, type AccountEntry } from "./schema";

export function mockAccountEntry(overrides?: Partial<AccountEntry>): AccountEntry {
  const descriptor = overrides?.descriptor ?? mockAddressAccountDescriptor();
  return AccountEntrySchema.parse({
    accountUUID: computeAccountUUID(descriptor),
    descriptor,
    legacyId: "js:2:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:",
    ...overrides,
  });
}
