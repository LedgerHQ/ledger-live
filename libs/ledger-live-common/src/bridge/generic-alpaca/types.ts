import type { Operation, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";

type NetworkInfo = {
  fees: BigNumber;
};

export type GenericTransaction = TransactionCommon & {
  family: string;
  fees?: BigNumber | null;
  storageLimit?: BigNumber | null;
  customFees?: {
    parameters: { fees?: BigNumber | null };
  };
  tag?: number | null | undefined;
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
  chainId?: number;
  gasLimit?: BigNumber | null;
  gasPrice?: BigNumber | null;
  maxFeePerGas?: BigNumber | null;
  maxPriorityFeePerGas?: BigNumber | null;
};

export interface OperationCommon extends Operation {
  extra: Record<string, any>;
}
