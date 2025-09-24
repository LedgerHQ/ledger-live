import BigNumber from "bignumber.js";
import type { TransactionCommon } from "@ledgerhq/types-live";
import type { Unit } from "@ledgerhq/types-cryptoassets";

type NetworkInfo = {
  fees: BigNumber;
};

export type GenericTransaction = TransactionCommon & {
  family: string;
  fees?: BigNumber | null;
  customFees?: {
    parameters: { fees?: BigNumber | null };
  };
  memo?: string | null | undefined;
  tag?: number | null | undefined;
  feeCustomUnit?: Unit | null | undefined;
  memoType?: string | null;
  memoValue?: string | null;
  mode?: "send" | "changeTrust" | "send-legacy" | "send-eip1559" | "token-associate";
  assetReference?: string;
  assetOwner?: string;
  networkInfo?: NetworkInfo | null;
};
