/* eslint-disable @typescript-eslint/no-explicit-any */
import * as bitcoin from "bitcoinjs-lib";
import bs58 from "bs58";
import { padStart } from "lodash";
import { DerivationModes } from "./types";
import { Currency, ICrypto } from "./crypto/types";
import cryptoFactory from "./crypto/factory";
import { fallbackValidateAddress } from "./crypto/base";

export function parseHexString(str: any) {
  const result: Array<number> = [];
  while (str.length >= 2) {
    result.push(parseInt(str.substring(0, 2), 16));
    // eslint-disable-next-line no-param-reassign
    str = str.substring(2, str.length);
  }
  return result;
}

export function encodeBase58Check(vchIn: any) {
  // eslint-disable-next-line no-param-reassign
  vchIn = parseHexString(vchIn);
  let chksum = bitcoin.crypto.sha256(Buffer.from(vchIn));
  chksum = bitcoin.crypto.sha256(chksum);
  chksum = chksum.slice(0, 4);
  const hash = vchIn.concat(Array.from(chksum));
  return bs58.encode(hash);
}

export function toHexDigit(number: any) {
  const digits = "0123456789abcdef";
  // eslint-disable-next-line no-bitwise
  return digits.charAt(number >> 4) + digits.charAt(number & 0x0f);
}

export function toHexInt(number: any) {
  return (
    // eslint-disable-next-line no-bitwise
    toHexDigit((number >> 24) & 0xff) +
    // eslint-disable-next-line no-bitwise
    toHexDigit((number >> 16) & 0xff) +
    // eslint-disable-next-line no-bitwise
    toHexDigit((number >> 8) & 0xff) +
    // eslint-disable-next-line no-bitwise
    toHexDigit(number & 0xff)
  );
}

export function compressPublicKey(publicKey: any) {
  let compressedKeyIndex;
  if (publicKey.substring(0, 2) !== "04") {
    // eslint-disable-next-line no-throw-literal
    throw new Error("Invalid public key format");
  }
  if (parseInt(publicKey.substring(128, 130), 16) % 2 !== 0) {
    compressedKeyIndex = "03";
  } else {
    compressedKeyIndex = "02";
  }
  const result = compressedKeyIndex + publicKey.substring(2, 66);
  return result;
}

export function createXPUB(
  depth: any,
  fingerprint: any,
  childnum: any,
  chaincode: any,
  publicKey: any,
  network: any
) {
  let xpub = toHexInt(network);
  xpub += padStart(depth.toString(16), 2, "0");
  xpub += padStart(fingerprint.toString(16), 8, "0");
  xpub += padStart(childnum.toString(16), 8, "0");
  xpub += chaincode;
  xpub += publicKey;
  return xpub;
}

export function byteSize(count: number) {
  if (count < 0xfd) {
    return 1;
  }
  if (count <= 0xffff) {
    return 2;
  }
  if (count <= 0xffffffff) {
    return 4;
  }
  return 8;
}

// refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/api_impl/BitcoinLikeTransactionApi.cpp#L217
export function estimateTxSize(
  inputCount: number,
  outputCount: number,
  currency: ICrypto,
  derivationMode: string
) {
  let txSize = 0;
  let fixedSize = 0;
  // Fixed size computation
  fixedSize = 4; // Transaction version
  if (currency.network.usesTimestampedTransaction) fixedSize += 4; // Timestamp
  fixedSize += byteSize(inputCount); // Number of inputs
  fixedSize += byteSize(outputCount); // Number of outputs
  fixedSize += 4; // Timelock
  // refer to https://medium.com/coinmonks/on-bitcoin-transaction-sizes-part-2-9445373d17f4
  // and https://bitcoin.stackexchange.com/questions/96017/what-are-the-sizes-of-single-sig-and-2-of-3-multisig-taproot-inputs
  if (derivationMode === DerivationModes.TAPROOT) {
    txSize = fixedSize + 57.5 * inputCount + 43 * outputCount;
    return Math.ceil(txSize);
  }
  const isSegwit =
    derivationMode === DerivationModes.NATIVE_SEGWIT ||
    derivationMode === DerivationModes.SEGWIT;
  if (isSegwit) {
    // Native Segwit: 32 PrevTxHash + 4 Index + 1 null byte + 4 sequence
    // P2SH: 32 PrevTxHash + 4 Index + 23 scriptPubKey + 4 sequence
    const isNativeSegwit = derivationMode === DerivationModes.NATIVE_SEGWIT;
    const inputSize = isNativeSegwit ? 41 : 63;
    const noWitness = fixedSize + inputSize * inputCount + 34 * outputCount;
    // Include flag and marker size (one byte each)
    const witnessSize = noWitness + 108 * inputCount + 2;
    txSize = (noWitness * 3 + witnessSize) / 4;
  } else {
    txSize = fixedSize + 148 * inputCount + 34 * outputCount;
  }
  return Math.ceil(txSize); // We don't allow floating value
}

// refer to https://github.com/LedgerHQ/lib-ledger-core/blob/fc9d762b83fc2b269d072b662065747a64ab2816/core/src/wallet/bitcoin/api_impl/BitcoinLikeTransactionApi.cpp#L253
export function computeDustAmount(currency: ICrypto, txSize: number) {
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

export function isValidAddress(address: string, currency?: Currency) {
  if (!currency) {
    // If the caller doesn't provide the currency, we'll
    // fallback to a pre-taproot basic validation that doesn't
    // check every aspect of the address
    return fallbackValidateAddress(address);
  }
  const crypto = cryptoFactory(currency);
  return crypto.validateAddress(address);
}

export function isTaprootAddress(address: string, currency?: Currency) {
  if (currency === "bitcoin") {
    return cryptoFactory("bitcoin").isTaprootAddress(address);
  } else if (currency === "bitcoin_testnet") {
    return cryptoFactory("bitcoin_testnet").isTaprootAddress(address);
  } else {
    return false;
  }
}
