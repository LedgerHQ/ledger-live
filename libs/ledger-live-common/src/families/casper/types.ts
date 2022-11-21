import {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { DeployUtil } from "casper-js-sdk";

type FamilyType = "casper";

export type Transaction = TransactionCommon & {
  family: FamilyType;
  deploy: DeployUtil.Deploy | null;
  fees: BigNumber;
  transferId?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  transferId?: string;
  fees: string;
  deploy: ReturnType<typeof DeployUtil.deployToJson> | null;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
