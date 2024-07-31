import {
  IAddress,
  PROTOCOL_INDICATOR,
  fromEthAddress,
  isEthAddress,
  fromString,
  toEthAddress,
} from "iso-filecoin/address";
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

export const isIdAddress = (addr: IAddress) => addr.protocol === PROTOCOL_INDICATOR.ID;

export const isEthereumConvertableAddr = (addr: IAddress) =>
  isIdAddress(addr) || isFilEthAddress(addr);

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

  if (isEthereumConvertableAddr(valid.parsedAddress)) {
    return true;
  }

  return false;
};

export const getEquivalentAddress = (addr: string): string => {
  if (isEthAddress(addr)) {
    if (!addr.startsWith("0x")) addr = "0x" + addr;
    return fromEthAddress(addr, "mainnet").toString();
  } else {
    const parsed = fromString(addr);
    if (isEthereumConvertableAddr(parsed)) {
      return toEthAddress(parsed);
    }
    return "";
  }
};

export const convertAddressFilToEth = (addr: string): string => {
  if (isEthAddress(addr)) {
    return addr;
  }

  const parsed = fromString(addr);
  if (isEthereumConvertableAddr(parsed)) {
    return toEthAddress(parsed);
  }
  throw new Error("address type not supported");
};

export const convertAddressEthToFil = (addr: string): string => {
  if (!isEthAddress(addr)) {
    return addr;
  }

  if (!addr.startsWith("0x")) addr = "0x" + addr;
  return fromEthAddress(addr, "mainnet").toString();
};
