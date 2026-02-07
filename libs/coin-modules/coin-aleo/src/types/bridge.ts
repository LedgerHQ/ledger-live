import type BigNumber from "bignumber.js";
import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { TRANSACTION_TYPE } from "../constants";
import type { AleoPrivateRecord } from "./api";
import type { AleoUnspentRecord, ProvableApi } from "./logic";

export type Transaction = TransactionCommon & {
  family: "aleo";
  fees: BigNumber;
} & (
    | {
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC;
      }
    | {
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE;
        amountRecord: string | null;
        feeRecord: string | null;
      }
    | {
        type: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;
      }
    | {
        type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
        amountRecord: string | null;
        feeRecord: string | null;
      }
  );

export type TransactionRaw = TransactionCommonRaw & {
  family: "aleo";
  fees: string;
} & (
    | {
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC;
      }
    | {
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE;
        amountRecord: string | null;
        feeRecord: string | null;
      }
    | {
        type: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;
      }
    | {
        type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
        amountRecord: string | null;
        feeRecord: string | null;
      }
  );

export type TransactionTransfer = Extract<
  Transaction,
  { type: TRANSACTION_TYPE.TRANSFER_PUBLIC | TRANSACTION_TYPE.TRANSFER_PRIVATE }
>;

export type TransactionSelfTransfer = Extract<
  Transaction,
  { type: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE | TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC }
>;

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface AleoResources {
  transparentBalance: BigNumber;
  privateBalance: BigNumber | null;
  lastPrivateSyncDate: Date | null;
  provableApi: ProvableApi | null;
  privateRecordsHistory: AleoPrivateRecord[] | null;
  unspentPrivateRecords: AleoUnspentRecord[] | null;
}

export interface AleoResourcesRaw {
  transparentBalance: string;
  privateBalance: string | null;
  lastPrivateSyncDate: string | null;
  provableApi: string | null;
  privateRecordsHistory: string | null;
  unspentPrivateRecords: string | null;
}

export type AleoAccount = Account & {
  aleoResources: AleoResources;
};

export type AleoAccountRaw = AccountRaw & {
  aleoResources: AleoResourcesRaw;
};

export type AleoTransactionType = "public" | "private";

export type AleoOperationExtra = {
  functionId: string;
  transactionType: AleoTransactionType;
};

export type AleoOperation = Operation<AleoOperationExtra>;
