import BigNumber from "bignumber.js";
import { DerivationModes } from "./types";
import { Currency, ICrypto } from "./crypto/types";
import cryptoFactory from "./crypto/factory";
import { fallbackValidateAddress } from "./crypto/base";
import { UnsupportedDerivation } from "@ledgerhq/coin-framework/errors";
import varuint from "varuint-bitcoin";
import { NetworkInfoResponse } from "./explorer/types";

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

/**
 * Calculates the maximun size of an imaginary transaction in virtual bytes
 * (vB). 1vB = 4 WU (weight units). If a cryptocurrency doesn't use segwit, then
 * 1 byte = 1 vB. Weight units are used for segwit transactions, where certain
 * bytes of the transaction is counted as 4 WU and some as 1 WU. The resulting
 * size is then ceil(totalWU/4) vB.
 *
 * refer to https://medium.com/coinmonks/on-bitcoin-transaction-sizes-part-2-9445373d17f4
 * and https://bitcoin.stackexchange.com/questions/96017/what-are-the-sizes-of-single-sig-and-2-of-3-multisig-taproot-inputs
 * and https://bitcoinops.org/en/tools/calc-size/
 *
 * Suggested improvement: I assume that these calculations won't be exactly
 * correct for altcoins (but I don't know). Therefore we should move this
 * functionality into ICrypto, to make it easier to provide slightly different
 * calculations for different cryptocurrencies.
 *
 * The reason for the name maxTxSize, instead of just txSize, is that the size
 * of modern ecdsa signatures aren't know beforehand. They are either 71 or
 * 72 bytes. This function always count with 72 byte signatures.
 *
 * The size of schnorr signatures is expected to be 65 bytes, since the Bitcoin
 * hardware app appends the optional sighash type 01 at the end of the
 * signature. If the app removes that optional byte, this functions should be
 * updated to use 64 byte schnorr signatures, even if 65 still is an acceptable
 * maximum.
 *
 * @param inputCount Number of inputs of the imaginary transaction
 * @param outputAddrs The addresses of the outputs, excluding change.
 * @param includeChange Indicates whether we should add a change output. The
 * change output will have the same derivation mode as the inputs. See
 * derivationMode parameter.
 * @param currency The currency for which the calculation is done.
 * @param derivationMode The derivation mode used for calculating the size of
 * the inputs.
 */
export function maxTxSize(
  inputCount: number,
  outputScripts: Buffer[],
  includeChange: boolean,
  currency: ICrypto,
  derivationMode: string,
): number {
  const fixed = fixedWeight(currency, derivationMode);

  let outputsWeight = byteSize(outputScripts.length) * baseByte; // Number of outputs;
  outputScripts.forEach(script => {
    outputsWeight += outputSize(currency, script) * baseByte;
  });

  if (includeChange) {
    outputsWeight += outputWeight(derivationMode);
  }

  // Input: 32 PrevTxHash + 4 Index + 1 scriptSigLength + 4 sequence
  let inputsWeight = byteSize(inputCount) * baseByte; // Number of inputs
  inputsWeight += inputWeight(derivationMode) * inputCount;
  // More bytes for decred, refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/api_impl/BitcoinLikeTransactionApi.cpp#L162
  if (currency.network.name === "Decred") {
    inputsWeight += 64 * inputCount;
  }
  const txWeight = fixed + inputsWeight + outputsWeight;

  return txWeight / 4;
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
  } else if (currency === "bitcoin_testnet") {
    return cryptoFactory("bitcoin_testnet").isTaprootAddress(address);
  } else {
    return false;
  }
}

export function writeVarInt(buffer: Buffer, i: number, offset: number): number {
  // refer to https://github.com/bitcoinjs/bitcoinjs-lib/blob/1f44f722d30cd14a1861c8546e6b455f73862c1e/src/bufferutils.js#L78
  varuint.encode(i, buffer, offset);
  offset += varuint.encode.bytes;
  return offset;
}

// --- NEW: exact weight helpers (no floats) ---
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
  defaultFloor: BigNumber = new BigNumber(1),
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
