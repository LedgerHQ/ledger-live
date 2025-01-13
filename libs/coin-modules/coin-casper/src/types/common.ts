import {
  Account,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ExtraDeviceTransactionField } from "../bridge/deviceTransactionConfig";

type FamilyType = "casper";

export type CasperAccount = Account;

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  transferId?: string | undefined;
};

export type CasperOperation = Operation<CasperOperationExtra>;

interface CasperOperationExtra {
  transferId?: string | undefined;
}

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  transferId?: string | undefined;
  fees: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type { ExtraDeviceTransactionField };
