import {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { DeployUtil } from "casper-js-sdk";

type FamilyType = "casper";

export type Transaction = TransactionCommon & {
  family: FamilyType;
  deploy: DeployUtil.Deploy | null;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  deploy: ReturnType<typeof DeployUtil.deployToJson> | null;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
