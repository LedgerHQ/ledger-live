import { isValidAddress } from "algosdk";

/**
 * Validate an Algorand address
 * @param address - The address to validate
 * @returns True if the address is valid
 */
export function validateAddress(address: string): boolean {
  return isValidAddress(address);
}
