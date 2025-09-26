import { TransactionCommon } from "@ledgerhq/types-live";
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
    parameters: { fees?: BigNumber | null; storageLimit?: BigNumber | null };
  };
  tag?: number | null | undefined;
  feeCustomUnit?: Unit | null | undefined;
  memoType?: string | null;
  memoValue?: string | null;
  data?: Buffer;
  type?: number;
  mode?: "send" | "changeTrust" | "send-legacy" | "send-eip1559";
  assetReference?: string;
  assetOwner?: string;
  networkInfo?: NetworkInfo | null;
};
