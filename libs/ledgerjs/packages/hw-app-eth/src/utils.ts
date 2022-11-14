import { encode, decode } from "@ethersproject/rlp";
import { BigNumber } from "bignumber.js";
import { LedgerEthTransactionResolution } from "./services/types";

export function splitPath(path: string): number[] {
  const result: number[] = [];
  const components = path.split("/");
  components.forEach((element) => {
    let number = parseInt(element, 10);
    if (isNaN(number)) {
      return; // FIXME shouldn't it throws instead?
    }
    if (element.length > 1 && element[element.length - 1] === "'") {
      number += 0x80000000;
    }
    result.push(number);
  });
  return result;
}

export function hexBuffer(str: string): Buffer {
  return Buffer.from(str.startsWith("0x") ? str.slice(2) : str, "hex");
}

export function maybeHexBuffer(
  str: string | null | undefined
): Buffer | null | undefined {
  if (!str) return null;
  return hexBuffer(str);
}

export const decodeTxInfo = (rawTx: Buffer) => {
  const VALID_TYPES = [1, 2];
  const txType = VALID_TYPES.includes(rawTx[0]) ? rawTx[0] : null;
  const rlpData = txType === null ? rawTx : rawTx.slice(1);
  const rlpTx = decode(rlpData).map((hex) => Buffer.from(hex.slice(2), "hex"));
  let chainIdTruncated = 0;
  const rlpDecoded = decode(rlpData);

  let decodedTx;
  if (txType === 2) {
    // EIP1559
    decodedTx = {
      data: rlpDecoded[7],
      to: rlpDecoded[5],
      chainId: rlpTx[0],
    };
  } else if (txType === 1) {
    // EIP2930
    decodedTx = {
      data: rlpDecoded[6],
      to: rlpDecoded[4],
      chainId: rlpTx[0],
    };
  } else {
    // Legacy tx
    decodedTx = {
      data: rlpDecoded[5],
      to: rlpDecoded[3],
      // Default to 1 for non EIP 155 txs
      chainId: rlpTx.length > 6 ? rlpTx[6] : Buffer.from("0x01", "hex"),
    };
  }

  const chainIdSrc = decodedTx.chainId;
  let chainId = new BigNumber(0);
  if (chainIdSrc) {
    // Using BigNumber because chainID could be any uint256.
    chainId = new BigNumber(chainIdSrc.toString("hex"), 16);
    const chainIdTruncatedBuf = Buffer.alloc(4);
    if (chainIdSrc.length > 4) {
      chainIdSrc.copy(chainIdTruncatedBuf);
    } else {
      chainIdSrc.copy(chainIdTruncatedBuf, 4 - chainIdSrc.length);
    }
    chainIdTruncated = chainIdTruncatedBuf.readUInt32BE(0);
  }

  let vrsOffset = 0;
  if (txType === null && rlpTx.length > 6) {
    const rlpVrs = Buffer.from(encode(rlpTx.slice(-3)).slice(2), "hex");

    vrsOffset = rawTx.length - (rlpVrs.length - 1);

    // First byte > 0xf7 means the length of the list length doesn't fit in a single byte.
    if (rlpVrs[0] > 0xf7) {
      // Increment vrsOffset to account for that extra byte.
      vrsOffset++;

      // Compute size of the list length.
      const sizeOfListLen = rlpVrs[0] - 0xf7;

      // Increase rlpOffset by the size of the list length.
      vrsOffset += sizeOfListLen - 1;
    }
  }

  return {
    decodedTx,
    txType,
    chainId,
    chainIdTruncated,
    vrsOffset,
  };
};

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

/**
 * @ignore for the README
 *
 * List of selectors (hexadecimal representation of the used method's signature) related to
 * ERC20 (Tokens), ERC721/ERC1155 (NFT).
 * You can verify and/or get more info about them on http://4byte.directory
 */

export enum ERC20_CLEAR_SIGNED_SELECTORS {
  APPROVE = "0x095ea7b3",
  TRANSFER = "0xa9059cbb",
}

export enum ERC721_CLEAR_SIGNED_SELECTORS {
  APPROVE = "0x095ea7b3",
  SET_APPROVAL_FOR_ALL = "0xa22cb465",
  TRANSFER_FROM = "0x23b872dd",
  SAFE_TRANSFER_FROM = "0x42842e0e",
  SAFE_TRANSFER_FROM_WITH_DATA = "0xb88d4fde",
}

export enum ERC1155_CLEAR_SIGNED_SELECTORS {
  SET_APPROVAL_FOR_ALL = "0xa22cb465",
  SAFE_TRANSFER_FROM = "0xf242432a",
  SAFE_BATCH_TRANSFER_FROM = "0x2eb2c2d6",
}

export const tokenSelectors = Object.values(ERC20_CLEAR_SIGNED_SELECTORS);
export const nftSelectors = [
  ...Object.values(ERC721_CLEAR_SIGNED_SELECTORS),
  ...Object.values(ERC1155_CLEAR_SIGNED_SELECTORS),
];

export const mergeResolutions = (
  oldResolution: Partial<LedgerEthTransactionResolution>,
  newResolution: Partial<LedgerEthTransactionResolution>
): LedgerEthTransactionResolution => {
  const resolutions: LedgerEthTransactionResolution = {
    nfts: [],
    erc20Tokens: [],
    externalPlugin: [],
    plugin: [],
  };

  for (const key in oldResolution) {
    resolutions[key].push(...oldResolution[key]);
  }

  for (const key in newResolution) {
    resolutions[key].push(...newResolution[key]);
  }

  return resolutions;
};
