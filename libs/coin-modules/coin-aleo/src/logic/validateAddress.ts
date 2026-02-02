import type { AddressValidationCurrencyParameters } from "@ledgerhq/types-live";
import { bech32m } from "./bech32m";

/**
 * The human-readable-part of the bech32m addresses for Aleo.
 */
const ALEO_HRP = "aleo";

/**
 * The expected length of an Aleo address (63 characters).
 */
const ALEO_ADDRESS_LENGTH = 63;

/**
 * Validates an Aleo address by checking:
 * - Correct bech32m format (Aleo uses bech32m encoding)
 * - Correct prefix ("aleo")
 * - Correct length (63 characters)
 *
 * @param {string} address - The Aleo address to validate
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (!address || address.length !== ALEO_ADDRESS_LENGTH) {
    return false;
  }

  if (!address.startsWith(ALEO_HRP + "1")) {
    return false;
  }

  try {
    const decoded = bech32m.decode(address, ALEO_ADDRESS_LENGTH);
    return decoded.prefix === ALEO_HRP;
  } catch {
    return false;
  }
}
