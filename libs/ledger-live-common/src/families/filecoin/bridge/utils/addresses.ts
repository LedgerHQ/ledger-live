import { IAddress, PROTOCOL_INDICATOR, fromEthAddress, fromString } from "iso-filecoin/address";
import { log } from "@ledgerhq/logs";

export type ValidateAddressResult =
  | {
      isValid: true;
      parsedAddress: IAddress;
    }
  | {
      isValid: false;
    };

export const isFilEthAddress = (addr: IAddress) =>
  addr.protocol === PROTOCOL_INDICATOR.DELEGATED && addr.namespace === 10;

export const validateAddress = (input: string): ValidateAddressResult => {
  try {
    const parsedAddress = fromString(input);
    return { isValid: true, parsedAddress };
  } catch (error) {
    log("debug", `[validateAddress] fromString invalid address`);
  }

  try {
    // allow non 0x starting eth addresses as well
    if (!input.startsWith("0x")) input = "0x" + input;
    const parsedAddress = fromEthAddress(input, "mainnet");
    return { isValid: true, parsedAddress };
  } catch (error) {
    log("debug", `[validateAddress] fromEthAddress invalid address`);
  }

  return { isValid: false };
};
