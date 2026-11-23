import {
  computeAccountUUID,
  mockAddressAccountDescriptor,
} from "@domain/entity-account-descriptor/schema.mock";
import {
  AccountEntrySchema,
  LegacyAccountEntrySchema,
  type AccountEntry,
  type LegacyAccountEntry,
} from "./entry";

export function mockAccountEntry(overrides?: Partial<AccountEntry>): AccountEntry {
  const descriptor = overrides?.descriptor ?? mockAddressAccountDescriptor();
  return AccountEntrySchema.parse({
    accountUUID: computeAccountUUID(descriptor),
    descriptor,
    legacyId: "js:2:ethereum:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:",
    ...overrides,
  });
}

export function mockLegacyAccountEntry(overrides?: Partial<AccountEntry>): LegacyAccountEntry {
  return LegacyAccountEntrySchema.parse(mockAccountEntry(overrides));
}
