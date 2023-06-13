import { encodeAddress, decodeAddress } from "@polkadot/util-crypto";
import { hexToU8a, isHex } from "@polkadot/util";

const POLKADOT_SS58_PREFIX = 0;

/**
 * Returns true if address is valid, false if it's invalid (can't parse or wrong checksum)
 *
 * @param {*} address
 */
// TODO Cache this to improve perf
export const isValidAddress = (
  address: string,
  ss58Format: number = POLKADOT_SS58_PREFIX,
): boolean => {
  if (!address) return false;

  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address, false, ss58Format));
    return true;
  } catch (err) {
    return false;
  }
};
