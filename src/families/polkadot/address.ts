import { decodeAddress } from "@polkadot/util-crypto";

const POLKADOT_SS58_PREFIX = 0;

/**
 * Returns true if address is valid, false if it's invalid (can't parse or wrong checksum)
 *
 * @param {*} address
 */
export const isValidAddress = (
  address: string,
  ss58Format: number = POLKADOT_SS58_PREFIX
): boolean => {
  if (!address) return false;

  try {
    decodeAddress(address, false, ss58Format);
    return true;
  } catch (err) {
    return false;
  }
};
