import { BigNumber } from "bignumber.js";
import * as rlp from "@ethersproject/rlp";
import {
  ERC20_CLEAR_SIGNED_SELECTORS,
  ERC721_CLEAR_SIGNED_SELECTORS,
  ERC1155_CLEAR_SIGNED_SELECTORS,
  DAPP_SELECTORS,
} from "@ledgerhq/evm-tools/selectors/index";
import type { Transaction } from "@ethersproject/transactions";
import { LedgerEthTransactionResolution } from "./services/types";

export {
  ERC20_CLEAR_SIGNED_SELECTORS,
  ERC721_CLEAR_SIGNED_SELECTORS,
  ERC1155_CLEAR_SIGNED_SELECTORS,
  DAPP_SELECTORS,
};

export const padHexString = (str: string) => {
  return str.length % 2 ? "0" + str : str;
};

export function splitPath(path: string): number[] {
  const splittedPath: number[] = [];

  const paths = path.split("/");
  paths.forEach(path => {
    let value = parseInt(path, 10);
    if (isNaN(value)) {
      return; // FIXME shouldn't it throws instead?
    }
    // Detect hardened paths
    if (path.length > 1 && path[path.length - 1] === "'") {
      value += 0x80000000;
    }
    splittedPath.push(value);
  });

  return splittedPath;
}

export function hexBuffer(str: string): Buffer {
  if (!str) return Buffer.alloc(0);

  const strWithoutPrefix = str.startsWith("0x") ? str.slice(2) : str;
  return Buffer.from(padHexString(strWithoutPrefix), "hex");
}

export function maybeHexBuffer(str: string | null | undefined): Buffer | null | undefined {
  if (!str) return null;
  return hexBuffer(str);
}

/**
 * @ignore for the README
 *
 * Helper to convert an integer as a hexadecimal string with the right amount of digits
 * to respect the number of bytes given as parameter
 *
 * @param int Integer
 * @param bytes Number of bytes it should be represented as (1 byte = 2 caraters)
 * @returns The given integer as an hexa string padded with the right number of 0
 */
export const intAsHexBytes = (int: number, bytes: number): string =>
  int.toString(16).padStart(2 * bytes, "0");

export const tokenSelectors = Object.values(ERC20_CLEAR_SIGNED_SELECTORS);
export const nftSelectors = [
  ...Object.values(ERC721_CLEAR_SIGNED_SELECTORS),
  ...Object.values(ERC1155_CLEAR_SIGNED_SELECTORS),
];

export const mergeResolutions = (
  resolutionsArray: Partial<LedgerEthTransactionResolution>[],
): LedgerEthTransactionResolution => {
  const mergedResolutions: LedgerEthTransactionResolution = {
    nfts: [],
    erc20Tokens: [],
    externalPlugin: [],
    plugin: [],
    domains: [],
  };

  for (const resolutions of resolutionsArray) {
    for (const key in resolutions) {
      mergedResolutions[key].push(...resolutions[key]);
    }
  }

  return mergedResolutions;
};

/**
 * @ignore for the README
 *
 * Ledger devices are returning v with potentially EIP-155 already applied when using legacy transactions.
 * Because that v value is only represented as a single byte, we need to replicate what would be the
 * overflow happening on the device while applying EIP-155 and recover the original parity.
 *
 * @param vFromDevice
 * @param chainIdUint32
 * @returns
 */
export const getParity = (
  vFromDevice: number,
  chainId: BigNumber,
  transactionType: Transaction["type"],
): 0 | 1 => {
  if (transactionType) return vFromDevice as 0 | 1;

  // The device use a 4 bytes integer to represent the chainId and keeps the highest bytes
  const chainIdUint32 = getChainIdAsUint32(chainId);

  // Then applies EIP-155 to this chainId
  const chainIdWithEIP155 = chainIdUint32 * 2 + 35;
  // Since it's a single byte, we need to apply the overflow after reaching the max 0xff value and starting again to 0x00
  // for both possible values, the chainId with EIP155 and a 0 or 1 parity included
  const chainIdWithOverflowZero = chainIdWithEIP155 % 256;
  const chainIdWithOverflowOne = (chainIdWithEIP155 + 1) % 256;

  if (chainIdWithOverflowZero === vFromDevice) {
    return 0;
  } else if (chainIdWithOverflowOne === vFromDevice) {
    return 1;
  }
  throw new Error("Invalid v value");
};

/**
 * @ignore for the README
 *
 * Helper to convert a chainId from a BigNumber to a 4 bytes integer.
 * ChainIds are uint256, but the device limits them to 4 bytes
 *
 * @param {Number|BigNumber} chainId
 * @returns {Number}
 */
export const getChainIdAsUint32 = (chainId: BigNumber | number): number => {
  const chainIdBuff = Buffer.from(padHexString(new BigNumber(chainId).toString(16)), "hex");
  const chainIdUint32 = chainIdBuff.subarray(0, 4);

  return parseInt(chainIdUint32.toString("hex"), 16);
};

/**
 * @ignore for the README
 *
 * Depending on the transaction type you're trying to sign with the device, the v value will be different.
 * For legacy transactions, the v value is used to store the chainId, and that chainId can be a uint256,
 * and some math operation should be applied to it in order to comply with EIP-155 for replay attacks.
 *
 * In order to prevent breaking changes at the time, the `v` value has been kept as a single byte
 * which forces us to replicate an overflow happening on the device to get the correct `v` value
 *
 * @param {number} vFromDevice
 * @param {BigNumber} chainId
 * @param {Transaction["type"]} transactionType
 * @returns {string} hexa string of the v value
 */
export const getV = (
  vFromDevice: number,
  chainId: BigNumber,
  transactionType: Transaction["type"],
): string => {
  if (chainId.isZero()) return vFromDevice.toString(16);

  const parity = getParity(vFromDevice, chainId, transactionType);
  return !transactionType
    ? // Legacy transactions (type 0) should apply EIP-155
      // EIP-155: rlp[(nonce, gasprice, startgas, to, value, data, chainid, 0, 0)]
      padHexString(chainId.times(2).plus(35).plus(parity).toString(16))
    : // Transactions after type 1 should only use partity (00/01) as their v value
      // EIP-2930: 0x01 || rlp([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, *signatureYParity*, signatureR, signatureS])
      // EIP-1559: 0x02 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, amount, data, access_list, *signature_y_parity*, signature_r, signature_s])
      // EIP-4844: 0x03 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, to, value, data, access_list, max_fee_per_blob_gas, blob_versioned_hashes, *y_parity*, r, s])
      // EIP-7702: 0x05 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, value, data, access_list, authorization_list, *signature_y_parity*, signature_r, signature_s])
      padHexString(parity.toString(16));
};

/**
 * @ignore for the README
 *
 * In order to prevent the device from considering a transaction RLP as complete before it actually is
 * we need to split the RLP into chunks which could not be mistaken for a complete transaction.
 * This is true for legacy transaction, where the `v` value is used to store the chainId
 *
 * @param {Buffer} transactionRlp
 * @param {Buffer }derivationPath
 * @param {Transaction["type"]} transactionType
 *
 * @returns {Buffer[]}
 */
export const safeChunkTransaction = (
  transactionRlp: Buffer,
  derivationPath: Buffer,
  transactionType: Transaction["type"],
): Buffer[] => {
  const maxChunkSize = 255;
  // The full payload is the derivation path + the complete RLP of the transaction
  const payload = Buffer.concat([derivationPath, transactionRlp]);
  if (payload.length <= maxChunkSize) return [payload];

  if (transactionType) {
    const chunks = Math.ceil(payload.length / maxChunkSize);
    return new Array(chunks)
      .fill(null)
      .map((_, i) => payload.subarray(i * maxChunkSize, (i + 1) * maxChunkSize));
  }

  // Decode the RLP of the full transaction and keep only the last 3 elements (v, r, s)
  const decodedVrs: number[] = rlp.decode(transactionRlp).slice(-3);
  // Encode those values back to RLP in order to get the length of this serialized list
  // Result should be something like [0xc0 + list payload length, list.map(rlp)]
  // since only v can be used to store the chainId in legacy transactions
  const encodedVrs = rlp.encode(decodedVrs);
  // Since chainIds are uint256, the list payload length can be 1B (v rlp description) + 32B (v) + 1B (r) + 1B (s) = 35B max (< 55B)
  // Therefore, the RLP of this vrs list should be prefixed by a value between [0xc1, 0xe3] (0xc0 + 35B = 0xe3 max)
  // @see https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/
  // `encodedVrs` is then everything but the first byte of this serialization
  const encodedVrsBuff = hexBuffer(encodedVrs).subarray(1);

  // Since we want to avoid chunking just before the v,r,s values,
  // we just check the size of that payload and detect
  // if it would fit perfectly in 255B chunks
  // if it does, we chunk smaller parts
  let chunkSize = 0;
  const lastChunkSize = payload.length % maxChunkSize;
  if (lastChunkSize === 0 || lastChunkSize > encodedVrsBuff.length) {
    chunkSize = maxChunkSize;
  } else {
    for (let i = 1; i <= maxChunkSize; i++) {
      const lastChunkSize = payload.length % (maxChunkSize - i);
      if (lastChunkSize === 0 || lastChunkSize > encodedVrsBuff.length) {
        chunkSize = maxChunkSize - i;
        break;
      }
    }
  }
  const chunks = Math.ceil(payload.length / chunkSize);
  return new Array(chunks)
    .fill(null)
    .map((_, i) => payload.subarray(i * chunkSize, (i + 1) * chunkSize));
};
