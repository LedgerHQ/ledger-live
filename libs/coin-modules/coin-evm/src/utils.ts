import type {
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import eip55 from "eip55";
import type { Transaction as EvmTransaction } from "./types";
import type { SeiDelegation } from "./types/staking";

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

export function isEthAddress(address: string): boolean {
  return /^(0x)?[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Normalizes an Ethereum address to lowercase to avoid checksum validation issues.
 *
 * Some chains like RSK use EIP-1191 (chain-specific checksum) instead of EIP-55.
 * When an address has a valid EIP-1191 checksum but not a valid EIP-55 checksum,
 * ethers.js will throw "bad address checksum" error.
 *
 * Converting the address to lowercase bypasses checksum validation in ethers.js
 * since lowercase addresses are treated as not checksummed.
 *
 * @see https://github.com/rsksmart/RSKIPs/blob/master/IPs/RSKIP60.md
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Safely converts a value to BigInt, returning 0n if conversion fails
 */
export const safeBigInt = (value: string | number | bigint): bigint => {
  try {
    return BigInt(value.toString());
  } catch {
    return 0n;
  }
};

export const isSeiDelegation = (candidate: unknown): candidate is SeiDelegation => {
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    "balance" in candidate &&
    typeof (candidate as Record<string, unknown>).balance === "object" &&
    (candidate as Record<string, unknown>).balance !== null &&
    "amount" in ((candidate as Record<string, unknown>).balance as Record<string, unknown>) &&
    "denom" in ((candidate as Record<string, unknown>).balance as Record<string, unknown>)
  );
};

export const isSeiDelegationArray = (candidate: unknown): candidate is SeiDelegation[] => {
  return Array.isArray(candidate) && candidate.length > 0 && isSeiDelegation(candidate[0]);
};

/**
 * Extracts delegation from decoded result with proper type safety
 */
export const extractSeiDelegation = (decoded: unknown): SeiDelegation | undefined => {
  if (isSeiDelegationArray(decoded)) {
    return decoded[0];
  }
  if (isSeiDelegation(decoded)) {
    return decoded;
  }
  return undefined;
};

/**
 * Gets amount from SEI delegation with safe conversion
 */
export const getSeiDelegationAmount = (delegation: SeiDelegation | undefined): bigint => {
  if (!delegation) {
    return 0n;
  }

  const amount = delegation.balance.amount;
  if (typeof amount === "string" || typeof amount === "number" || typeof amount === "bigint") {
    return safeBigInt(amount);
  }

  return 0n;
};

/**
 * Gets amount from CELO decoded result with safe conversion
 */
export const getCeloAmount = (decoded: unknown): bigint => {
  if (Array.isArray(decoded) && decoded.length > 0) {
    const first = decoded[0];
    if (first && typeof first.toString === "function") {
      return safeBigInt(first.toString());
    }
  }
  return 0n;
};

/**
 * Checks if a transaction intent is a staking intent
 */
export function isStakingIntent(intent: TransactionIntent): intent is StakingTransactionIntent {
  return intent.intentType === "staking";
}
