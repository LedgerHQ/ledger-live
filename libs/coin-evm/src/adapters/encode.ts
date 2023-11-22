import { log } from "@ledgerhq/logs";
import eip55 from "eip55";

/**
 * Some addresses returned by Ledger explorers are not 40 characters hex addresses
 * For example the explorers may return "0x0" as an address (for example for
 * some events or contract interactions, like a contract creation transaction)
 *
 * This is not a valid EIP55 address and thus will fail when trying to encode it
 * with a "Bad address" error.
 * cf:
 * https://github.com/cryptocoinjs/eip55/blob/v2.1.1/index.js#L5-L6
 * https://github.com/cryptocoinjs/eip55/blob/v2.1.1/index.js#L63-L65
 *
 * Since we can't control what the explorer returns, and we don't want the app to crash
 * in these cases, we simply ignore the address and return an empty string.
 *
 * For now this has only been observed on the from or to fields of an operation
 * so we only use this function for these fields.
 */
export const safeEncodeEIP55 = (addr: string): string => {
  if (!addr || addr === "0x" || addr === "0x0") {
    return "";
  }

  try {
    return eip55.encode(addr);
  } catch (e) {
    log("EVM Family - adapters/ledger", "Failed to eip55 encode address", {
      address: addr,
      error: e,
    });

    return addr;
  }
};
