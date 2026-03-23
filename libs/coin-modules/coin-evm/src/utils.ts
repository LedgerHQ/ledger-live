import type {
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/types";
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

/** Discriminant for smart contract call vs contract creation (deployment). */
export type ContractInteractionKind = "SmartContractInteraction" | "SmartContractDeployment";

/**
 * True when `input` carries non-trivial calldata or init code (not empty / whitespace-only /
 * bare hex prefix). Leading and trailing whitespace are ignored; `0x` / `0X` with no payload
 * after trim are treated as empty.
 */
export function isSmartContractInput(input: string | null | undefined): input is string {
  if (input === null || input === undefined) {
    return false;
  }
  const trimmed = input.trim();
  if (trimmed === "") {
    return false;
  }
  if (trimmed.length === 2 && trimmed.toLowerCase() === "0x") {
    return false;
  }
  return true;
}

/**
 * Builds flat `details` fields for Alpaca when a tx has smart contract input.
 *
 * `contractAddress` (when present) identifies the relevant contract: for
 * `SmartContractInteraction` it is the called address (`to`); for
 * `SmartContractDeployment` it is the created contract when
 * `deployedContractAddress` is known (e.g. from a receipt), otherwise omitted.
 */
export function buildSmartContractDetails(
  to: string | undefined,
  input: string | undefined,
  deployedContractAddress?: string | undefined,
): Record<string, unknown> | undefined {
  if (!isSmartContractInput(input)) {
    return undefined;
  }
  const trimmedInput = input.trim();
  const encodedTo = to ? safeEncodeEIP55(to) : "";
  const contractInteraction: ContractInteractionKind = encodedTo
    ? "SmartContractInteraction"
    : "SmartContractDeployment";
  const contractPayload = /^0x/i.test(trimmedInput)
    ? `0x${trimmedInput.slice(2)}`
    : `0x${trimmedInput}`;
  const encodedDeployed = deployedContractAddress ? safeEncodeEIP55(deployedContractAddress) : "";
  const contractAddress = encodedDeployed || encodedTo;
  return {
    contractInteraction,
    ...(contractAddress ? { contractAddress } : {}),
    contractPayload,
  };
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

export const unwrapProxy = (proxy: unknown): unknown => {
  if (proxy && typeof proxy === "object" && proxy.constructor.name === "Proxy") {
    return Object.fromEntries(Object.entries(proxy).map(([k, v]) => [k, unwrapProxy(v)]));
  }
  if (Array.isArray(proxy)) return proxy.map(unwrapProxy);
  return proxy;
};

export const isSeiDelegation = (candidate: unknown): candidate is SeiDelegation => {
  // Plain object format: { balance: { amount, denom }, delegation: { delegator_address, validator_address, ... } }
  if (candidate !== null && typeof candidate === "object" && !Array.isArray(candidate)) {
    const obj = candidate as Record<string, unknown>;
    const balance = obj.balance;
    const delegation = obj.delegation;
    return (
      balance !== null &&
      typeof balance === "object" &&
      !Array.isArray(balance) &&
      "amount" in balance &&
      "denom" in balance &&
      typeof balance.denom === "string" &&
      delegation !== null &&
      typeof delegation === "object" &&
      !Array.isArray(delegation) &&
      "delegator_address" in delegation &&
      "validator_address" in delegation &&
      typeof delegation.delegator_address === "string" &&
      typeof delegation.validator_address === "string"
    );
  }

  // ABI-decoded tuple format from ethers.js: [[amount, denom], [delegator_address, shares, decimals, validator_address]]
  if (!Array.isArray(candidate) || candidate.length !== 2) return false;

  const [balance, delegation] = candidate;

  return (
    Array.isArray(balance) &&
    balance.length === 2 &&
    typeof balance[0] === "bigint" && // amount
    typeof balance[1] === "string" && // denom
    Array.isArray(delegation) &&
    delegation.length === 4 &&
    typeof delegation[0] === "string" && // delegator_address
    typeof delegation[1] === "bigint" && // shares
    typeof delegation[2] === "bigint" && // decimals
    typeof delegation[3] === "string" // validator_address
  );
};

export const isSeiDelegationArray = (candidate: unknown): candidate is SeiDelegation[] => {
  return Array.isArray(candidate) && candidate.length > 0 && isSeiDelegation(candidate[0]);
};

/**
 * Normalizes a decoded delegation into a plain SeiDelegation.
 * Handles both plain objects (from mocks/tests) and ethers.Result (array-like tuples
 * where named properties are NOT reachable via the `in` operator).
 */
export const extractSeiDelegation = (decoded: unknown): SeiDelegation | undefined => {
  if (!Array.isArray(decoded) || decoded.length === 0) return undefined;

  const outer = decoded[0] as unknown;

  // Plain object with full delegation metadata
  if (isSeiDelegation(outer)) return outer;

  // ABI-decoded tuple / ethers.Result — normalize into a plain SeiDelegation shape
  return normalizeSeiDelegation(outer);
};

function normalizeSeiDelegation(outer: unknown): SeiDelegation | undefined {
  if (typeof outer !== "object" || outer === null) return undefined;

  const rec = outer as Record<string, unknown>;
  const balanceTuple = rec.balance ?? (Array.isArray(outer) ? (outer as unknown[])[0] : undefined);
  if (typeof balanceTuple !== "object" || balanceTuple === null) return undefined;

  const balRec = balanceTuple as Record<string, unknown>;
  let amount: unknown;
  let denom: unknown;

  if ("amount" in balRec && "denom" in balRec) {
    amount = balRec.amount;
    denom = balRec.denom;
  } else if (Array.isArray(balanceTuple) && balanceTuple.length >= 2) {
    amount = balanceTuple[0];
    denom = balanceTuple[1];
  } else {
    return undefined;
  }

  if (typeof denom !== "string") return undefined;
  if (typeof amount !== "string" && typeof amount !== "number" && typeof amount !== "bigint") {
    return undefined;
  }

  return {
    balance: { amount, denom },
    delegation: { delegator_address: "", shares: 0, decimals: 0, validator_address: "" },
  };
}

/**
 * SEI staking precompile returns `balance.amount` in usei (6 decimals).
 * Native `sei_evm` currency uses magnitude 18 (wei-like); convert so balances match `getCoinBalance` / account totals.
 * @see https://docs.sei.io/evm/precompiles/staking (delegation query)
 */
const SEI_USEI_TO_NATIVE_MIN_UNIT = 10n ** 12n; // 10^(18-6)

function seiBalanceAmountToNativeMinUnit(amount: unknown, denom: string): bigint {
  const n = toBigIntLoose(amount);
  if (n === null) {
    return 0n;
  }
  const d = denom.toLowerCase();
  if (d === "usei" || d === "") {
    return n * SEI_USEI_TO_NATIVE_MIN_UNIT;
  }
  return n;
}

function toBigIntLoose(value: unknown): bigint | null {
  if (typeof value === "bigint") {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    return safeBigInt(value);
  }
  if (
    value !== null &&
    typeof value === "object" &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    // value.toString() may produce non-numeric strings (e.g. "[object Object]"),
    // in which case safeBigInt returns 0n as a safe fallback.
    return safeBigInt(String(value));
  }
  return null;
}

/**
 * Gets amount from SEI delegation with safe conversion.
 * Converts usei (6 decimals) to the EVM-native unit (18 decimals) by applying a ×10^12 scale.
 */
export const getSeiDelegationAmount = (delegation: SeiDelegation | undefined): bigint => {
  if (!delegation) {
    return 0n;
  }

  const denom = typeof delegation.balance.denom === "string" ? delegation.balance.denom : "";
  return seiBalanceAmountToNativeMinUnit(delegation.balance.amount, denom);
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
