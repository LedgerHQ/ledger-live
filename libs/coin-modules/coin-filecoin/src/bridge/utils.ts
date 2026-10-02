import type { ExplorerView } from "@ledgerhq/ledger-wallet-framework/types";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getEquivalentAddress } from "../network";

export enum Methods {
  Transfer = 0,
  ERC20Transfer = 1,
  InvokeEVM = 3844450837,
}

export enum AccountType {
  Account = "Account",
  TokenAccount = "TokenAccount",
}

export enum BotScenario {
  DEFAULT = "default",
  ETH_RECIPIENT = "eth-recipient",
  F4_RECIPIENT = "f4-recipient",
  TOKEN_TRANSFER = "token-transfer",
}

const validHexRegExp = new RegExp(/^(0x)?[a-fA-F0-9]+$/);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

// TODO Filecoin - Use the new package @zondax/ledger-utils instead

export const isValidHex = (msg: string) => validHexRegExp.test(msg) && msg.length % 2 === 0;
export const isValidBase64 = (msg: string) => validBase64RegExp.test(msg);

export const methodToString = (method: number): string => {
  switch (method) {
    case Methods.Transfer:
      return "Transfer";
    case Methods.InvokeEVM:
      return "InvokeEVM (3844450837)";
    case Methods.ERC20Transfer:
      return "ERC20 Transfer";
    default:
      return "Unknown";
  }
};

export const getBufferFromString = (message: string): Buffer =>
  isValidHex(message)
    ? Buffer.from(message, "hex")
    : isValidBase64(message)
      ? Buffer.from(message, "base64")
      : Buffer.from(message);

export const calculateEstimatedFees = (gasFeeCap: BigNumber, gasLimit: BigNumber): BigNumber =>
  gasFeeCap.multipliedBy(gasLimit);

export function getAccountUnit(account: AccountLike) {
  if (account.type === AccountType.TokenAccount) {
    return account.token.units[0];
  }

  return account.currency.units[0];
}

export const expectedToFieldForTokenTransfer = (recipient: string) => {
  let value = recipient;
  const equivalent = getEquivalentAddress(value);

  if (equivalent && value !== equivalent) {
    value += ` / ${equivalent}`;
  }

  return value;
};

const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
const CID_V1 = 0x01;
const DIGEST_LENGTH = 32;

const decodeBase32 = (input: string): Uint8Array | undefined => {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of input) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) {
      return undefined;
    }
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(bytes);
};

const readVarint = (bytes: Uint8Array, offset: number): [number, number] | undefined => {
  let value = 0;
  let shift = 0;
  let cursor = offset;
  while (cursor < bytes.length) {
    const byte = bytes[cursor++];
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return [value, cursor];
    }
    shift += 7;
  }
  return undefined;
};

/**
 * Filecoin explorers built on the Ethereum JSON-RPC (Blockscout) identify a native message by
 * its multihash digest (`EthHashFromCid` in Lotus), not by its CID. FEVM operations already carry
 * a `0x` hash, and anything unparseable is returned unchanged.
 */
export const messageCidToEthHash = (hash: string): string => {
  if (!hash.startsWith("b")) {
    return hash;
  }
  const bytes = decodeBase32(hash.slice(1));
  if (!bytes || bytes[0] !== CID_V1) {
    return hash;
  }
  const codec = readVarint(bytes, 1);
  const hashFunction = codec && readVarint(bytes, codec[1]);
  const digestLength = hashFunction && readVarint(bytes, hashFunction[1]);
  if (!digestLength) {
    return hash;
  }
  const [length, digestOffset] = digestLength;
  if (length !== DIGEST_LENGTH || digestOffset + length !== bytes.length) {
    return hash;
  }
  return `0x${Buffer.from(bytes.subarray(digestOffset)).toString("hex")}`;
};

export const getTransactionExplorer = (
  explorerView: ExplorerView | null | undefined,
  operation: Operation,
): string | undefined => explorerView?.tx?.replace("$hash", messageCidToEthHash(operation.hash));
