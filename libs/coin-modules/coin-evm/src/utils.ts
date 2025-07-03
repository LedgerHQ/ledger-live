import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import eip55 from "eip55";
import { Transaction as EvmTransaction } from "./types";

/**
 * Some addresses returned by the explorers are not 40 characters hex addresses
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
    log("EVM Family - utils.ts", "Failed to eip55 encode address", {
      address: addr,
      error: e,
    });

    return addr;
  }
};

/**
 * Helper to get the gas limit value for a tx, depending on if the user has set a custom value or not
 */
export const getGasLimit = (tx: EvmTransaction): BigNumber => tx.customGasLimit ?? tx.gasLimit;

/**
 * Helper to get total fee value for a tx depending on its type
 */
export const getEstimatedFees = (tx: EvmTransaction): BigNumber => {
  const gasLimit = getGasLimit(tx);

  if (tx.type !== 2) {
    return tx.gasPrice?.multipliedBy(gasLimit) || new BigNumber(0);
  }
  return tx.maxFeePerGas?.multipliedBy(gasLimit) || new BigNumber(0);
};

/**
 * Helper adding when necessary a 0
 * prefix if string length is odd
 */
export const padHexString = (str: string): string => {
  return str.length % 2 !== 0 ? "0" + str : str;
};

/**
 * arbitrary default value for a new transaction nonce
 * the actual nonce will be set by `prepareForSignOperation`
 */
export const DEFAULT_NONCE = -1;

export const DEFAULT_GAS_LIMIT = new BigNumber(21000);
