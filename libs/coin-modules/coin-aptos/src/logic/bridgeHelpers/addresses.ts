import { Account } from "@ledgerhq/types-live";

export const getAddress = (
  a: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: a.freshAddress, derivationPath: a.freshAddressPath });

export function isAddressValid(): boolean {
  try {
    return true;
  } catch (err) {
    return false;
  }
}
