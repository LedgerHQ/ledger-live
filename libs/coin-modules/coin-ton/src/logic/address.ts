import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/index";
import { Address } from "@ton/core";
import type { TonAddressBook } from "../network/types";

export const JETTON_ASSET_TYPE = "jetton";

export const isAddressValid = (recipient: string) => {
  try {
    return Boolean(
      (Address.isRaw(recipient) || Address.isFriendly(recipient)) && Address.parse(recipient),
    );
  } catch {
    return false;
  }
};

export const addressesAreEqual = (addr1: string, addr2: string) => {
  try {
    return (
      isAddressValid(addr1) &&
      isAddressValid(addr2) &&
      Address.parse(addr1).equals(Address.parse(addr2))
    );
  } catch {
    return false;
  }
};

export const toOwnFriendly = (address: Address): string =>
  address.toString({ urlSafe: true, bounceable: false });

export function toFriendly(rawOrFriendly: string, addressBook: TonAddressBook): string {
  return (
    addressBook[rawOrFriendly]?.user_friendly ??
    Address.parse(rawOrFriendly).toString({ urlSafe: true, bounceable: true })
  );
}

/**
 * The jetton master in the URL-safe bounceable form, the only one CAL matches. `assetOwner` is
 * the holder, as the generic adapter pairs balances with operations on it.
 */
export const toJettonAsset = (master: string, holder: string): AssetInfo => ({
  type: JETTON_ASSET_TYPE,
  assetReference: Address.parse(master).toString({ urlSafe: true, bounceable: true }),
  assetOwner: holder,
});
