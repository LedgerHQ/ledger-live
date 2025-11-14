import type {
  Operation,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";

type NetworkInfo = {
  fees: BigNumber;
};

type NetworkInfoRaw = {
  fees: string;
};

type Strategy = "slow" | "medium" | "fast";

export type FeeData = {
  maxFeePerGas: BigNumber | null;
  maxPriorityFeePerGas: BigNumber | null;
  gasPrice: BigNumber | null;
  nextBaseFee: BigNumber | null;
};

export type FeeDataRaw = {
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  gasPrice: string | null;
  nextBaseFee: string | null;
};

export type GasOptions = {
  [key in Strategy]: FeeData;
};

export type GasOptionsRaw = {
  [key in Strategy]: FeeDataRaw;
};

export type GenericTransaction = TransactionCommon & {
  family: string;
  fees?: BigNumber | null;
  storageLimit?: BigNumber | null;
  customFees?: {
    parameters: { fees?: BigNumber | null };
  };
  tag?: number | null | undefined;
  nonce?: BigNumber | null | undefined;
  feeCustomUnit?: Unit | null | undefined;
  memoType?: string | null;
  memoValue?: string | null;
  data?: Buffer;
  mode?:
    | "send"
    | "changeTrust"
    | "send-legacy"
    | "send-eip1559"
    | "delegate"
    | "stake"
    | "undelegate"
    | "unstake";
  type?: number | null;
  assetReference?: string;
  assetOwner?: string;
  networkInfo?: NetworkInfo | null;
  chainId?: number | null;
  gasLimit?: BigNumber | null;
  gasPrice?: BigNumber | null;
  maxFeePerGas?: BigNumber | null;
  maxPriorityFeePerGas?: BigNumber | null;
  gasOptions?: GasOptions;
};

export type GenericTransactionRaw = TransactionCommonRaw & {
  family: string;
  fees?: string | null;
  storageLimit?: string | null;
  customFees?: {
    parameters: { fees?: string | null };
  };
  tag?: number | null | undefined;
  nonce?: string | null | undefined;
  feeCustomUnit?: Unit | null | undefined;
  memoType?: string | null;
  memoValue?: string | null;
  data?: string;
  mode?:
    | "send"
    | "changeTrust"
    | "send-legacy"
    | "send-eip1559"
    | "delegate"
    | "stake"
    | "undelegate"
    | "unstake";
  type?: number | null;
  assetReference?: string | null;
  assetOwner?: string | null;
  networkInfo?: NetworkInfoRaw | null;
  chainId?: number | null;
  gasLimit?: string | null;
  gasPrice?: string | null;
  maxFeePerGas?: string | null;
  maxPriorityFeePerGas?: string | null;
  gasOptions?: GasOptionsRaw;
};

export interface OperationCommon extends Operation {
  extra: Record<string, any>;
}

export interface OperationCommonRaw extends OperationRaw {
  extra: Record<string, any>;
}
