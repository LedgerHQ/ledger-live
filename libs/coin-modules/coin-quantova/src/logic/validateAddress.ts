import { isValidQAddress } from "./address";

/**
 * Validate a Quantova recipient address. Accepts the canonical "Q1..." Bech32m form and
 * the hex H160 form; both must carry the 0x40 "Q" brand byte.
 */
export async function validateAddress(address: string): Promise<boolean> {
  return isValidQAddress(address);
}
