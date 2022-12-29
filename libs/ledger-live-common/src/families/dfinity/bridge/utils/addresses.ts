import { Account, Address } from "@ledgerhq/types-live";

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export function validateAddress(_address: string): { isValid: boolean } {
  return { isValid: true }; // TODO: Implement validation logic
}
