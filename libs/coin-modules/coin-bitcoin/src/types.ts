import type { BigNumber } from "bignumber.js";
import type {
  Account as WalletAccount,
  SerializedAccount as WalletAccountRaw,
} from "@ledgerhq/wallet-btc/index";
import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
  Operation,
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
  walletAccount?: WalletAccount | undefined;
};

export type BitcoinResourcesRaw = {
  utxos: BitcoinOutputRaw[];
  walletAccount?: WalletAccountRaw | undefined;
};

export const initialBitcoinResourcesValue = {
  utxos: [],
};

// Defined with the network parameters, which the coin module API shares with the bridge.
export { BitcoinLikeFeePolicy, BitcoinLikeSigHashType } from "./networks";
export type { BitcoinLikeNetworkParameters } from "./networks";

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
  relayFeePerByte: BigNumber;
};
export type NetworkInfoRaw = {
  family: "bitcoin";
  feeItems: FeeItemsRaw;
  // optional for back-compat with transactions serialized before this field existed
  relayFeePerByte?: string;
};
export const bitcoinPickingStrategy = {
  DEEP_OUTPUTS_FIRST: 0,
  OPTIMIZE_SIZE: 1,
  MERGE_OUTPUTS: 2,
  CUSTOM: 3,
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
  opReturnData?: Buffer | undefined;
  changeAddress?: string | undefined;
  psbt?: string;
  replaceTxId?: string | undefined;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "bitcoin";
  utxoStrategy: UtxoStrategy;
  rbf: boolean;
  feePerByte: string | null | undefined;
  networkInfo: NetworkInfoRaw | null | undefined;
  opReturnData?: Buffer | undefined;
  changeAddress?: string | undefined;
  replaceTxId?: string | undefined;
};

export type TransactionStatus = TransactionStatusCommon & {
  txInputs: BitcoinInput[] | undefined;
  txOutputs: BitcoinOutput[] | undefined;
  opReturnData: string | undefined;
  changeAddress: string | undefined;
};

export type TransactionStatusRaw = TransactionStatusCommonRaw & {
  txInputs: BitcoinInputRaw[] | undefined;
  txOutputs: BitcoinOutputRaw[] | undefined;
  opReturnData: string | undefined;
  changeAddress: string | undefined;
};

export type BitcoinAccount = Account & { bitcoinResources: BitcoinResources };

export type BitcoinAccountRaw = AccountRaw & {
  bitcoinResources: BitcoinResourcesRaw;
};

export type BtcInputRef = {
  hash: string;
  outputIndex: number;
  address: string;
};

export type BtcOperationExtra = {
  /** Input outpoints in "txid-index" format. Used by RBF/conflict-dedup logic. */
  inputs?: string[];
  /** Structured input references with address metadata. Parallel to `inputs`. */
  inputRefs?: BtcInputRef[];
};

export type BtcOperation = Operation<BtcOperationExtra>;

/** @deprecated Import from "./chain-adapters/zcash/types" */
export type { ZcashAccount, ZcashAccountRaw } from "./chain-adapters/zcash/types";

// Possible types of "replace by fee" (aka "edit transaction") operations:
export type EditType = "cancel" | "speedup";
