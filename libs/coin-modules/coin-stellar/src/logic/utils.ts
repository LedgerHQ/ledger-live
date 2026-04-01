import { StrKey } from "@stellar/stellar-sdk";
import { fetchSigners } from "../network";

export const STELLAR_BURN_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

export async function isAccountMultiSign(account: string): Promise<boolean> {
  const signers = await fetchSigners(account);
  return signers.length > 1;
}

/**
 * Returns true if address is valid, false if it's invalid (can't parse or wrong checksum)
 *
 * @param {*} address
 */
export function isAddressValid(address: string): boolean {
  if (!address) return false;

  // FIXME Workaround for burn address, see https://ledgerhq.atlassian.net/browse/LIVE-4014
  if (address === STELLAR_BURN_ADDRESS) return false;

  try {
    return StrKey.isValidEd25519PublicKey(address) || StrKey.isValidMed25519PublicKey(address);
  } catch {
    return false;
  }
}
