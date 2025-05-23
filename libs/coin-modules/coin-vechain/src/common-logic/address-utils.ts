import { Address } from "@vechain/sdk-core";
import hexUtils from "./hex-utils";

/**
 * Validate the address
 * @param address - the address to validate
 * @returns true if the address is valid, false otherwise
 */
export const isValid = (address: string): boolean => {
  return Address.isValid(hexUtils.addPrefix(address));
};
