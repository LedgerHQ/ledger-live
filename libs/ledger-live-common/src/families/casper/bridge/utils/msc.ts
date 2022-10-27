import { Account, Address } from "@ledgerhq/types-live";

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export const getPublicKey = (a: Account): string => {
  const address =
    a.freshAddresses.length > 0
      ? a.freshAddresses[0]
      : { address: a.freshAddress, derivationPath: a.freshAddressPath };

  return address.address.substring(2);
};
