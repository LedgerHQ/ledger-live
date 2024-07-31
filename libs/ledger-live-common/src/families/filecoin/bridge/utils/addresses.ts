import {
  IAddress,
  PROTOCOL_INDICATOR,
  fromEthAddress,
  fromString,
  toEthAddress,
} from "iso-filecoin/address";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";

export type ValidateAddressResult =
  | {
      isValid: true;
      parsedAddress: IAddress;
    }
  | {
      isValid: false;
    };

export const convertF4ToEthAddress = (addr: string) => {
  const parsed = fromString(addr);

  return toEthAddress(parsed);
};

export const convertF0toEthAddress = (addr: string): string => {
  if (addr.slice(0, 2) != "f0") {
    throw new Error("Address does not start with f0");
  }

  const id = new BigNumber(addr.slice(2));
  const idHex = id.toString(16).padStart(16, "0");

  return `0xff${"".padStart(22, "0")}${idHex}`;
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

export const isRecipientValidForTokenTransfer = (addr: string): boolean => {
  if (addr.length < 2) {
    return false;
  }

  const valid = validateAddress(addr);
  if (!valid.isValid) {
    return false;
  }

  const accountType = addr.substring(0, 2);
  if (["f0", "0x", "f4"].includes(accountType)) {
    return true;
  }

  return false;
};

export const convertAddressFilToEth = (addr: string): string => {
  const recipientAddressProtocol = addr.slice(0, 2);

  switch (recipientAddressProtocol) {
    case "f0":
      return convertF0toEthAddress(addr);
    case "f4":
      return convertF4ToEthAddress(addr);
    case "0x":
      return addr;
    default:
      throw new Error("supported address protocols are f0, f4");
  }
};
