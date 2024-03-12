import type { BigNumber } from "bignumber.js";
import type { Account as WalletAccount, SerializedAccount as WalletAccountRaw } from "./wallet-btc";
import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type BitcoinInput = {
  address: string | null | undefined;
  value: BigNumber | null | undefined;
  previousTxHash: string | null | undefined;
  previousOutputIndex: number;
};

export type BitcoinInputRaw = [
  string | null | undefined,
  string | null | undefined,
  string | null | undefined,
  number,
];

export type BitcoinOutput = {
  hash: string;
  outputIndex: number;
  blockHeight: number | null | undefined;
  address: string | null | undefined;
  value: BigNumber;
  rbf: boolean;
  isChange: boolean;
};

export type BitcoinOutputRaw = [
  string,
  number,
  number | null | undefined,
  string | null | undefined,
  string,
  number, // rbf 0/1 for compression
  number,
];

export type BitcoinResources = {
  utxos: BitcoinOutput[];
  walletAccount?: WalletAccount;
};

export type BitcoinResourcesRaw = {
  utxos: BitcoinOutputRaw[];
  walletAccount?: WalletAccountRaw;
};

export const initialBitcoinResourcesValue = {
  utxos: [],
};

export const BitcoinLikeFeePolicy = Object.freeze({
  PER_BYTE: "PER_BYTE",
  PER_KBYTE: "PER_KBYTE",
});

export const BitcoinLikeSigHashType = Object.freeze({
  SIGHASH_ALL: 0x01,
  SIGHASH_NONE: 0x02,
  SIGHASH_SINGLE: 0x03,
  SIGHASH_FORKID: 0x40,
  SIGHASH_ANYONECANPAY: 0x80,
});

export type BitcoinLikeNetworkParameters = {
  // Name of the network.
  identifier: string;
  // Version of the Pay To Public Hash standard.
  P2PKHVersion: Buffer;
  // Version of the Pay To Script Hash standard.
  P2SHVersion: Buffer;
  // Version of the Extended Public Key standard.
  xpubVersion: Buffer;
  // Policy to use when expressing fee amount, values in BitcoinLikeFeePolicy
  feePolicy: string;
  // Minimal amount a UTXO should have before being considered BTC dust.
  dustAmount: BigNumber;
  // Constant prefix to prepend all signature messages.
  messagePrefix: string;
  // Are transactions encoded with timestamp?
  usesTimestampedTransaction: boolean;
  // Delay applied to all timestamps. Used to debounce transactions.
  timestampDelay: BigNumber;
  // Bitcoin signature flag indicating what part of a transaction a signature signs, values in BitcoinLikeSigHashType
  sigHash: number;
  // Addition BIPs enabled for this network.
  additionalBIPs: string[];
};

export type FeeItem = {
  key: string;
  speed: string;
  feePerByte: BigNumber;
};
export type FeeItems = {
  items: FeeItem[];
  defaultFeePerByte: BigNumber;
};
export type FeeItemRaw = {
  key: string;
  speed: string;
  feePerByte: string;
};
export type FeeItemsRaw = {
  items: FeeItemRaw[];
  defaultFeePerByte: string;
};
export type NetworkInfo = {
  family: "bitcoin";
  feeItems: FeeItems;
};
export type NetworkInfoRaw = {
  family: "bitcoin";
  feeItems: FeeItemsRaw;
};
export const bitcoinPickingStrategy = {
  DEEP_OUTPUTS_FIRST: 0,
  OPTIMIZE_SIZE: 1,
  MERGE_OUTPUTS: 2,
};
export type BitcoinPickingStrategy =
  (typeof bitcoinPickingStrategy)[keyof typeof bitcoinPickingStrategy];

export type UtxoStrategy = {
  strategy: BitcoinPickingStrategy;
  excludeUTXOs: Array<{
    hash: string;
    outputIndex: number;
  }>;
};

export type Transaction = TransactionCommon & {
  family: "bitcoin";
  utxoStrategy: UtxoStrategy;
  rbf: boolean;
  feePerByte: BigNumber | null | undefined;
  networkInfo: NetworkInfo | null | undefined;
  opReturnData?: Buffer;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "bitcoin";
  utxoStrategy: UtxoStrategy;
  rbf: boolean;
  feePerByte: string | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
  opReturnData?: Buffer;
};

export type TransactionStatus = TransactionStatusCommon & {
  txInputs?: BitcoinInput[];
  txOutputs?: BitcoinOutput[];
  opReturnData?: string;
};

export type TransactionStatusRaw = TransactionStatusCommonRaw & {
  txInputs?: BitcoinInputRaw[];
  txOutputs?: BitcoinOutputRaw[];
  opReturnData?: string;
};

export type BitcoinAccount = Account & { bitcoinResources: BitcoinResources };

export type BitcoinAccountRaw = AccountRaw & {
  bitcoinResources: BitcoinResourcesRaw;
};
