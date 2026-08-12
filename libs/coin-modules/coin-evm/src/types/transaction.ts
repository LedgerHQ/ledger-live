import BigNumber from "bignumber.js";

export type FeeHistory = {
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  oldestBlock: string;
  reward: string[][];
};

export type ApiFeeData = {
  maxFeePerGas: bigint | null;
  maxPriorityFeePerGas: bigint | null;
  gasPrice: bigint | null;
  // only used by UI send flow in advanced mode for EIP-1559
  nextBaseFee: bigint | null;
};

export type FeeData = {
  maxFeePerGas: BigNumber | null;
  maxPriorityFeePerGas: BigNumber | null;
  gasPrice: BigNumber | null;
  // only used by UI send flow in advanced mode for EIP-1559
  nextBaseFee: BigNumber | null;
};

export type FeeDataRaw = {
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  gasPrice: string | null;
  // only used by UI send flow in advanced mode for EIP-1559
  nextBaseFee: string | null;
};

export type Strategy = "slow" | "medium" | "fast";

export type ApiGasOptions = {
  [key in Strategy]: ApiFeeData;
};

export type GasOptions = {
  [key in Strategy]: FeeData;
};

export type GasOptionsRaw = {
  [key in Strategy]: FeeDataRaw;
};

export enum TransactionTypes {
  legacy = 0,
  eip1559 = 2,
}

export type TransactionLikeWithPreparedParams = {
  type: TransactionTypes;
  to: string | null;
  data: string;
  value: bigint | null;
  gasLimit: BigNumber;
};
