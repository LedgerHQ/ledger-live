import type { AddressValidationCurrencyParameters } from "@ledgerhq/coin-module-framework/api/types";
import bs58check from "bs58check";

/** TRON address prefix byte (mainnet, Shasta, Nile, and private networks). */
const TRON_ADDRESS_PREFIX_BYTE = 0x41;
const TRON_ADDRESS_DECODED_LENGTH = 21;
const TRON_BASE58_ADDRESS_LENGTH = 34;

/**
 * Validates a TRON address locally using Base58Check decoding.
 *
 * Previously this called the TronGrid API (/wallet/validateaddress),
 * which proved unreliable — it intermittently rejected valid addresses (e.g.
 * TNYJQhvXQAfeFFXH5G6cV5uXrx168fnFGE), causing transaction failures.
 *
 * A valid TRON address is a Base58Check-encoded 21-byte payload whose first
 * byte is 0x41. The same format is used on mainnet and testnets (Shasta, Nile).
 * No network call is required.
 *
 * @see https://developers.tron.network/docs/account#address-format
 */
export async function validateAddress(
  address: string,
  _parameters: Partial<AddressValidationCurrencyParameters>,
): Promise<boolean> {
  if (!address || address.length !== TRON_BASE58_ADDRESS_LENGTH || !address.startsWith("T")) {
    return false;
  }

  try {
    const decoded = bs58check.decode(address);
    return (
      decoded.length === TRON_ADDRESS_DECODED_LENGTH && decoded[0] === TRON_ADDRESS_PREFIX_BYTE
    );
  } catch {
    return false;
  }
}
