import {
  AddressAccountDescriptorSchema,
  UtxoAccountDescriptorSchema,
  type AddressAccountDescriptor,
  type UtxoAccountDescriptor,
} from "./schema";
import { ETH_ADDR, XPUB } from "./test-fixtures";

type MockOverrides<T> = Partial<Omit<T, "network">> & { network?: string };

export function mockUtxoAccountDescriptor(
  overrides?: MockOverrides<UtxoAccountDescriptor>,
): UtxoAccountDescriptor {
  return UtxoAccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "utxo",
    network: "bitcoin",
    key: XPUB,
    path: "m/84h/0h/0h",
    ...overrides,
  });
}

export function mockAddressAccountDescriptor(
  overrides?: MockOverrides<AddressAccountDescriptor>,
): AddressAccountDescriptor {
  return AddressAccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: "ethereum",
    key: ETH_ADDR,
    path: "m/44h/60h/0h/0/0",
    ...overrides,
  });
}
