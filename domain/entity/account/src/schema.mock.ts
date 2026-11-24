import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountUUID } from "./accountUUID";
import { computeAccountUUID as computeUUID } from "./descriptor/computeAccountUUID";
import {
  AccountEntrySchema,
  LegacyAccountEntrySchema,
  type AccountEntry,
  type LegacyAccountEntry,
} from "./entry";

/** Tests build an AccountUUID from a mock descriptor; production code receives it. */
export function computeAccountUUID(descriptor: AccountDescriptor): AccountUUID {
  return computeUUID(descriptor);
}

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
