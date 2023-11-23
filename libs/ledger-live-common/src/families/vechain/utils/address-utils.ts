import { address } from "thor-devkit";
import hexUtils from "./hex-utils";

export const isValid = (addr: string): boolean => {
  try {
    address.toChecksumed(hexUtils.addPrefix(addr));
    return true;
  } catch (e) {
    return false;
  }
};
