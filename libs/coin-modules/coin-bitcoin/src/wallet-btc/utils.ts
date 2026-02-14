import BigNumber from "bignumber.js";
import * as btc from "bitcoinjs-lib";
import { DerivationModes } from "./types";
import { Currency, ICrypto } from "./crypto/types";
import cryptoFactory from "./crypto/factory";
import { fallbackValidateAddress } from "./crypto/base";
import { UnsupportedDerivation } from "@ledgerhq/coin-framework/errors";
import varuint from "varuint-bitcoin";
import { NetworkInfoResponse } from "./explorer/types";
import { bech32m } from "../bech32m";

export function byteSize(count: number): number {
  if (count < 0xfd) {
    return 1;
  }
  if (count <= 0xffff) {
    return 3;
  }
  if (count <= 0xffffffff) {
    return 5;
  }
  return 9;
}

const baseByte = 4;

/** Weight unit multiplier for non-witness bytes */
const WU = baseByte; // = 4

/** Common non-witness prefix present in ALL inputs (bytes) */
const IN_NONWIT_PREFIX_BYTES =
  32 /* prev txid */ + 4 /* vout */ + 1 /* scriptSig length varint */ + 4; /* sequence */

/** ScriptSig sizes (bytes) */
const SCRIPTSIG_P2PKH_BYTES = 107; // canonical DER sig + pubkey, typical case
const SCRIPTSIG_P2SH_P2WPKH_BYTES =
  1 /* push redeemscript */ + 22; /* redeemscript: OP_0 <20-byte keyhash> */ // = 23

/** Witness stack weights (already in weight units, not bytes) */
// P2WPKH witness: 1 (stack items)
//  + (1 + 72) push+sig
//  + (1 + 33) push+pubkey  => 108 WU
const WITNESS_P2WPKH_WU = 1 + (1 + 72) + (1 + 33); // 108

// P2TR key-path witness: 1 (stack items)
//  + (1 + 65) push + 64-byte sig + sighash byte => 67 WU
const WITNESS_P2TR_KEYPATH_WU = 1 + (1 + 65); // 67

type InputWeightSpec = {
  /** extra non-witness bytes beyond the shared prefix (scriptSig bytes) */
  extraNonWitnessBytes: number;
  /** witness weight units to add (0 for legacy) */
  witnessWU: number;
};

const INPUT_WEIGHT_SPECS: Record<string, InputWeightSpec> = {
  [DerivationModes.LEGACY]: {
    extraNonWitnessBytes: SCRIPTSIG_P2PKH_BYTES,
    witnessWU: 0,
  },
  [DerivationModes.SEGWIT]: {
    // P2SH-P2WPKH: scriptSig holds the redeemscript (23 bytes), plus P2WPKH witness
    extraNonWitnessBytes: SCRIPTSIG_P2SH_P2WPKH_BYTES,
    witnessWU: WITNESS_P2WPKH_WU,
  },
  [DerivationModes.NATIVE_SEGWIT]: {
    // empty scriptSig (already accounted by the 1-byte length in the prefix), P2WPKH witness
    extraNonWitnessBytes: 0,
    witnessWU: WITNESS_P2WPKH_WU,
  },
  [DerivationModes.TAPROOT]: {
    // empty scriptSig, Taproot key-path witness
    extraNonWitnessBytes: 0,
    witnessWU: WITNESS_P2TR_KEYPATH_WU,
  },
};

function fixedWeight(currency: ICrypto, derivationMode: string): number {
  let fixedWeight = 4 * baseByte; // Transaction version
  if (currency.network.usesTimestampedTransaction) fixedWeight += 4 * baseByte; // Timestamp
  fixedWeight += 4 * baseByte; // Timelock
  if (derivationMode !== DerivationModes.LEGACY) {
    fixedWeight += 2; // Segwit marker & segwit flag, 1 WU per byte
  }
  return fixedWeight;
}

// https://ledgerhq.atlassian.net/wiki/spaces/WALLETCO/pages/6209372206/Fees+management
function inputWeight(derivationMode: string): number {
  const spec = INPUT_WEIGHT_SPECS[derivationMode];
  if (!spec) {
    throw UnsupportedDerivation(`Derivation mode ${derivationMode} unknown`);
  }

  // base non-witness weight for every input
  let weightWU = IN_NONWIT_PREFIX_BYTES * WU;

  // add derivation-specific non-witness payload (scriptSig)
  weightWU += spec.extraNonWitnessBytes * WU;

  // add witness (already in WU; no ×4)
  weightWU += spec.witnessWU;

  return weightWU;
}

function outputWeight(derivationMode: string): number {
  let outputSize = 8 + 1; // amount + script size
  if (derivationMode === DerivationModes.TAPROOT) {
    outputSize += 34; // "1" + PUSH32 + <32 bytes>
  } else if (derivationMode === DerivationModes.NATIVE_SEGWIT) {
    outputSize += 22; // "0" + PUSH20 + <20 bytes>
  } else if (derivationMode === DerivationModes.SEGWIT) {
    outputSize += 23; // HASH160 + PUSH20 + <20 bytes> + EQUAL
  } else if (derivationMode === DerivationModes.LEGACY) {
    outputSize += 25; // DUP + HASH160 + PUSH20 + <20 bytes> + EQUALVERIFY + CHECKSIG
  } else {
    throw UnsupportedDerivation(derivationMode);
  }

  return outputSize * 4;
}

export function outputSize(currency: ICrypto, outputScript: Buffer): number {
  let size = 1 + 8 + outputScript.length;
  // More bytes for decred
  if (currency.network.name === "Decred") {
    size += 8;
  }

  return size;
}

export function maxTxSizeCeil(
  inputCount: number,
  outputScripts: Buffer[],
  includeChange: boolean,
  currency: ICrypto,
  derivationMode: string,
): number {
  return vbytesCeilFromWeight(
    maxTxWeight(inputCount, outputScripts, includeChange, currency, derivationMode),
  );
}

// refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/api_impl/BitcoinLikeTransactionApi.cpp#L253
export function computeDustAmount(currency: ICrypto, txSize: number): number {
  let dustAmount = currency.network.dustThreshold;
  switch (currency.network.dustPolicy) {
    case "PER_KBYTE":
      dustAmount = (dustAmount * txSize) / 1000;
      break;
    case "PER_BYTE":
      dustAmount *= txSize;
      break;
    default:
      break;
  }

  return dustAmount;
}

export function isValidAddress(address: string, currency?: Currency): boolean {
  if (!currency) {
    // If the caller doesn't provide the currency, we'll
    // fallback to a pre-taproot basic validation that doesn't
    // check every aspect of the address
    return fallbackValidateAddress(address);
  }
  const crypto = cryptoFactory(currency);
  return crypto.validateAddress(address);
}

export function isTaprootAddress(address: string, currency?: Currency): boolean {
  if (currency === "bitcoin") {
    return cryptoFactory("bitcoin").isTaprootAddress(address);
  } else if (currency === "bitcoin_testnet" || currency === "bitcoin_regtest") {
    return cryptoFactory(currency).isTaprootAddress(address);
  } else {
    return false;
  }
}

/** P2TR (witness v1) output script: OP_1 (0x51) OP_PUSH32 (0x20) <32-byte schnorr pubkey> */
const P2TR_SCRIPT_LENGTH = 34;
const OP_1 = 0x51;
const OP_PUSH_32 = 0x20;

/**
 * Decode a Bitcoin output script to a base58 or bech32(m) address.
 * Handles P2TR (Taproot) scripts that bitcoinjs-lib's fromOutputScript may not support.
 */
export function scriptToAddress(script: Buffer, network: { bech32: string } & btc.Network): string {
  try {
    return btc.address.fromOutputScript(script, network);
  } catch (err) {
    // P2TR (Taproot): OP_1 OP_PUSH32 <32 bytes> — bitcoinjs-lib may not support it
    if (script.length === P2TR_SCRIPT_LENGTH && script[0] === OP_1 && script[1] === OP_PUSH_32) {
      const words = [1, ...bech32m.toWords(Array.from(script.subarray(2, 34)))];
      return bech32m.encode(network.bech32, words);
    }
    throw err;
  }
}

export function writeVarInt(buffer: Buffer, i: number, offset: number): number {
  // refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/1f44f722d30cd14a1861c8546e6b455f73862c1e/src/bufferutils.js#L78
  varuint.encode(i, buffer, offset);
  offset += varuint.encode.bytes;
  return offset;
}

/**
 * Calculates the maximum **weight** of an imaginary transaction in **weight units (WU)**.
 *
 * Why weight first?
 * - BIP141 defines transaction cost in *weight*, where non-witness bytes count as 4 WU
 *   and witness bytes count as 1 WU. Virtual bytes (vB) are then ceil(weight/4).
 * - This function returns an **integer WU** so callers can convert to vB with an exact
 *   integer step (see `vbytesCeilFromWeight`) without any floating-point drift.
 *
 * 
 * refer to https://medium.com/coinmonks/on-bitcoin-transaction-sizes-part-2-9445373d17f4
 * and https://bitcoin.stackexchange.com/questions/96017/what-are-the-sizes-of-single-sig-and-2-of-3-multisig-taproot-inputs
 * and https://bitcoinops.org/en/tools/calc-size/
 *

 *
 * Assumptions & notes
 * - Like `maxTxSize`, this uses a *maximum* signature size:
 *   - ECDSA sigs are assumed 72 bytes (DER) for worst-case (+1 varint for push).
 *   - Schnorr (Taproot) sigs are assumed **65 bytes** because the Bitcoin app appends
 *     an optional sighash byte `0x01`. If that byte is ever dropped, update the Taproot
 *     witness accounting to 64 bytes (still safe today because 65 ≥ 64).
 * - Change output, when requested, **always** matches the *input derivation mode*,
 *   not the recipient script type (critical for correct fee/change thresholds).
 * - For non-segwit currencies, every byte is effectively non-witness (4 WU per byte).
 *
 * Altcoins
 * - Exact sizes can vary across forks and sidechains. Where needed, this should live
 *   behind `ICrypto` so coin-specific quirks (script templates, extra fields, etc.)
 *   can be tuned without touching generic Bitcoin logic.
 *
 * Relationship to vbytes
 * - If you need virtual bytes (vB), call `vbytesCeilFromWeight(maxTxWeight(...))`.
 *   This is equivalent to `Math.ceil(weight/4)` but done with integers only.
 *
 * @param inputCount    Number of inputs of the imaginary transaction.
 * @param outputScripts Raw output scripts (excluding change). Each Buffer is the full PK script
 *                      that will appear in the tx output (OP codes + data).
 * @param includeChange Whether to add a change output. The change output **follows the input
 *                      derivation mode** (P2PKH / P2SH-P2WPKH / P2WPKH / P2TR).
 * @param currency      The currency/network context (provides address/output sizing rules).
 * @param derivationMode Derivation mode used to size inputs and the (optional) change output.
 *
 * @returns Integer **weight units (WU)** for the transaction with the given shape.
 */
export function maxTxWeight(
  inputCount: number,
  outputScripts: Buffer[],
  includeChange: boolean,
  currency: ICrypto,
  derivationMode: string,
): number {
  const fixed = fixedWeight(currency, derivationMode); // already in WU
  let outputsWeight = byteSize(outputScripts.length) * baseByte; // varint count (WU)
  outputScripts.forEach(script => {
    // outputSize() returns bytes; multiply by baseByte (4) to get WU
    outputsWeight += outputSize(currency, script) * baseByte;
  });
  if (includeChange) {
    outputsWeight += outputWeight(derivationMode); // already in WU
  }

  let inputsWeight = byteSize(inputCount) * baseByte; // varint count
  inputsWeight += inputWeight(derivationMode) * inputCount; // mixed witness/non-witness handled inside

  // Decred extra WU as before
  if (currency.network.name === "Decred") {
    inputsWeight += 64 * inputCount;
  }

  return fixed + inputsWeight + outputsWeight; // integer WU
}

/** Convert integer weight (WU) to vbytes ceil without FP. */
export function vbytesCeilFromWeight(weightWU: number): number {
  // ceil(weight/4) = (weight + 3) >> 2
  return (weightWU + 3) >> 2;
}

/** Exact vbytes ceil for a full tx (no FP). */
export function maxTxVBytesCeil(
  inputCount: number,
  outputScripts: Buffer[],
  includeChange: boolean,
  currency: ICrypto,
  derivationMode: string,
): number {
  return vbytesCeilFromWeight(
    maxTxWeight(inputCount, outputScripts, includeChange, currency, derivationMode),
  );
}

// --- Helpers: BTC/kB → sat/vB and clamping ---
function btcPerKbToSatPerVB(btcPerKbStr: string): BigNumber {
  // sat/vB = BTC/kB * 1e8 (sat/BTC) / 1000 (vB/kB); ceil to avoid under-floor
  return new BigNumber(btcPerKbStr).times(1e8).div(1000).integerValue(BigNumber.ROUND_CEIL);
}

/**
 * Ask the explorer for relay fee and return a safe sat/vB floor.
 * - Converts BTC/kB → sat/vB
 * - Clamps to ≥ 1 sat/vB
 * - Returns defaultFloor (1 sat/vB) on error or missing fields
 */
export async function getRelayFeeFloorSatVb(
  explorer: unknown,
  defaultFloor: BigNumber = new BigNumber(0),
): Promise<BigNumber> {
  try {
    const maybeExplorer = explorer as { getNetwork?: () => Promise<NetworkInfoResponse> };
    if (typeof maybeExplorer?.getNetwork !== "function") return defaultFloor;

    const net = await maybeExplorer.getNetwork();
    const relay = net?.relay_fee;
    if (relay === undefined || relay === null) return defaultFloor;

    const relSatPerVB = btcPerKbToSatPerVB(relay);
    if (!relSatPerVB.isFinite() || relSatPerVB.lt(0)) return defaultFloor;

    // keep it as provided (may be fractional), but never below 1
    return BigNumber.max(relSatPerVB, 1);
  } catch {
    return defaultFloor;
  }
}

/**
 * Incremental relay fee (sat/vB) for RBF: replacement must increase fee by at least this much
 * per vB (and in total). When the explorer does not provide incremental_fee, use a safer
 * default (1 sat/vB) so replacements are accepted by stricter nodes.
 *
 * When originalFeeRateSatVb is provided, the returned bump is: if 10% of original > 1 sat/vB
 * then use 10%, otherwise use 1 sat/vB (e.g. 15 sat/vB → 10% = 1.5 → bump 2; 5 sat/vB → 10% = 0.5 → bump 1).
 */
export async function getIncrementalFeeFloorSatVb(
  explorer: unknown,
  originalFeeRateSatVb?: BigNumber,
): Promise<BigNumber> {
  const defaultBump = new BigNumber(1);

  // Minimum bump: max(ceil(10% of original), 1 sat/vB)
  const tenPercentBump =
    originalFeeRateSatVb !== undefined &&
    originalFeeRateSatVb.isFinite() &&
    originalFeeRateSatVb.gte(0)
      ? originalFeeRateSatVb.times(0.1).integerValue(BigNumber.ROUND_CEIL)
      : defaultBump;
  const minBumpFromRule = BigNumber.max(tenPercentBump, defaultBump);

  try {
    const maybeExplorer = explorer as { getNetwork?: () => Promise<NetworkInfoResponse> };
    if (typeof maybeExplorer?.getNetwork !== "function") {
      return BigNumber.max(minBumpFromRule, defaultBump);
    }

    const net = await maybeExplorer.getNetwork();
    const incremental = net?.incremental_fee;
    if (incremental === undefined || incremental === null) {
      return BigNumber.max(minBumpFromRule, defaultBump);
    }

    const relSatPerVB = btcPerKbToSatPerVB(incremental);
    if (!relSatPerVB.isFinite() || relSatPerVB.lt(0)) {
      return BigNumber.max(minBumpFromRule, defaultBump);
    }

    const bump = BigNumber.max(relSatPerVB, minBumpFromRule, defaultBump);
    return bump;
  } catch {
    return BigNumber.max(minBumpFromRule, defaultBump);
  }
}
