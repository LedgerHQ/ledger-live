import type {
  Operation,
  OperationRaw,
  TransactionCommon,
  TransactionCommonRaw,
} from "@ledgerhq/types-live";
import type { GetAddressFn } from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import BigNumber from "bignumber.js";

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

export const GENERIC_TRANSACTION_MODE = [
  "send",
  "changeTrust",
  "send-legacy",
  "send-eip1559",
  "delegate",
  "redelegate",
  "stake",
  "undelegate",
  "unstake",
  "finalize_unstake",
  "withdraw",
  "claimReward",
  "compoundReward",
] as const;

export type GenericTransactionMode = (typeof GENERIC_TRANSACTION_MODE)[number];

export type GenericTransaction = TransactionCommon & {
  family: string;
  fees?: BigNumber | null;
  storageLimit?: BigNumber | null;
  customFees?: {
    parameters: { fees?: BigNumber | null };
  };
  tag?: number | null | undefined;
  nonce?: BigNumber | null | undefined;
  memoType?: string | null;
  memoValue?: string | null;
  data?: Buffer;
  mode?: GenericTransactionMode;
  type?: number | null;
  assetReference?: string;
  assetOwner?: string;
  networkInfo?: NetworkInfo | null;
  chainId?: number | null;
  gasLimit?: BigNumber | null;
  customGasLimit?: BigNumber | null;
  gasPrice?: BigNumber | null;
  maxFeePerGas?: BigNumber | null;
  maxPriorityFeePerGas?: BigNumber | null;
  additionalFees?: BigNumber | null;
  gasOptions?: GasOptions;
  sponsored?: boolean;
  valAddress?: string;
  valId?: string;
  withdrawId?: string;
  dstValAddress?: string;
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
  memoType?: string | null;
  memoValue?: string | null;
  data?: string;
  mode?: GenericTransactionMode;
  type?: number | null;
  assetReference?: string | null;
  assetOwner?: string | null;
  networkInfo?: NetworkInfoRaw | null;
  chainId?: number | null;
  gasLimit?: string | null;
  customGasLimit?: string | null;
  gasPrice?: string | null;
  maxFeePerGas?: string | null;
  maxPriorityFeePerGas?: string | null;
  additionalFees?: string | null;
  gasOptions?: GasOptionsRaw;
  sponsored?: boolean;
  valAddress?: string;
  valId?: string;
  withdrawId?: string;
  dstValAddress?: string;
};

export interface OperationCommon extends Operation {
  extra: Record<string, any>;
}

export interface OperationCommonRaw extends OperationRaw {
  extra: Record<string, any>;
}

export type LegacySigner = {
  signTransaction: (path: string, rawTxHex: string) => Promise<string>;
};

export type CoinFrameworkSigner<S = unknown> = {
  getAddress: GetAddressFn;
  signMessage?: (message: string) => Promise<string>;
  context: SignerContext<S>;
};

export type SignTransactionOptions = {
  rawTxHex: string;
  path: string;
  transaction: Buffer;
};
