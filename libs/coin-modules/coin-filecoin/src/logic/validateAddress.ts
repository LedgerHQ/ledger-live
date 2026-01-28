import { validateAddress as networkValidateAddress } from "../network/addresses";

/**
 * Validates a Filecoin address.
 * Supports f1/f3 (secp256k1/BLS), f4 (delegated/Ethereum-compatible) formats.
 *
 * @param address - The address to validate
 * @returns true if the address is valid, false otherwise
 */
export function validateAddress(address: string): boolean {
  // networkValidateAddress returns { isValid: boolean, parsedAddress?: IAddress }
  return networkValidateAddress(address).isValid;
}
