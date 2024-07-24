import {
  IAddress,
  PROTOCOL_INDICATOR,
  fromEthAddress,
  fromString,
  toEthAddress,
} from "iso-filecoin/address";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { fetchEthAddrForF1Fil } from "./api";

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

export const convertAddressFilToEthSync = (addr: string): string => {
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

export const convertAddressFilToEthAsync = async (addr: string): Promise<string> => {
  if (addr.length > 0 && addr.slice(0, 2) === "t1") {
    addr = `f${addr.slice(1)}`;
  }
  const recipientAddressProtocol = addr.slice(0, 2);

  switch (recipientAddressProtocol) {
    case "f1": {
      const res = await fetchEthAddrForF1Fil(addr);
      if (!res) {
        throw new Error("recipient account id not available on the network");
      }
      return res;
    }
    case "f0":
    case "f4":
    case "0x":
      return convertAddressFilToEthSync(addr);
    default:
      throw new Error("supported address protocols are f0, f1, f4, 0x");
  }
};
