import { Address } from "@vechain/sdk-core";
import { fixPrefixCase } from "./fixPrefixCase";

/**
 * Validate the address
 * @param address - the address to validate
 * @returns true if the address is valid, false otherwise
 */
export const parseAddress = (address: string): boolean => {
  return Address.isValid(fixPrefixCase(address));
};
