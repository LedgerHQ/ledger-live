import { AccountAddressSchema, type AccountAddress } from "./schema";

export function mockAccountAddress(overrides?: { freshAddress?: string }): AccountAddress {
  return AccountAddressSchema.parse({
    freshAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    ...overrides,
  });
}
