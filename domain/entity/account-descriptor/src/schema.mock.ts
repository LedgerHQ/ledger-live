import {
  AddressAccountDescriptorSchema,
  UtxoAccountDescriptorSchema,
  type AddressAccountDescriptor,
  type UtxoAccountDescriptor,
} from "./schema";
import { ETH_ADDR, XPUB } from "./test-fixtures";

export function mockUtxoAccountDescriptor(
  overrides?: Partial<UtxoAccountDescriptor>,
): UtxoAccountDescriptor {
  return UtxoAccountDescriptorSchema.parse({
    purpose: "account",
    version: "1",
    type: "utxo",
    network: { name: "bitcoin", env: "main" },
    xpub: XPUB,
    path: "m/84h/0h/0h",
    ...overrides,
  });
}

export function mockAddressAccountDescriptor(
  overrides?: Partial<AddressAccountDescriptor>,
): AddressAccountDescriptor {
  return AddressAccountDescriptorSchema.parse({
    purpose: "account",
    version: "1",
    type: "address",
    network: { name: "ethereum", env: "main" },
    address: ETH_ADDR,
    path: "m/44h/60h/0h/0/0",
    ...overrides,
  });
}
