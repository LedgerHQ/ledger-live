import BigNumber from "bignumber.js";
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
import type { AleoTransactionType } from "./api";
import type { ProvableApi, AleoUnspentRecord } from "./logic";

export type Transaction = TransactionCommon & {
  family: "aleo";
  fees: BigNumber;
} & (
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_PUBLIC;
      }
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_PRIVATE;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
      }
  );

export type TransactionRaw = TransactionCommonRaw & {
  family: "aleo";
  fees: string;
} & (
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_PUBLIC;
      }
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_PRIVATE;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
      }
  );

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface AleoResources {
  transparentBalance: BigNumber;
  provableApi: ProvableApi | null;
  privateBalance: BigNumber | null;
  unspentPrivateRecords: AleoUnspentRecord[] | null;
  lastPrivateSyncDate: Date | null;
}

export interface AleoResourcesRaw {
  transparentBalance: string;
  provableApi: string | null;
  privateBalance: string | null;
  unspentPrivateRecords: string | null;
  lastPrivateSyncDate: string | null;
}

export type AleoAccount = Account & {
  aleoResources?: AleoResources;
};

export type AleoAccountRaw = AccountRaw & {
  aleoResources?: AleoResourcesRaw;
};

export type AleoOperationExtra = {
  functionId: string;
  // this field is used to determine the type of balance that is related to the operation
  transactionType: AleoTransactionType;
  // this field is used to indicate that semi-public operation has been patched with private data after private sync
  patched?: boolean;
};

export type OperationDetailsExtraField = {
  key: keyof AleoOperationExtra;
  value: string | number;
};

export type AleoOperation = Operation<AleoOperationExtra>;

export type TransactionTransfer = Extract<
  Transaction,
  {
    mode: typeof TRANSACTION_TYPE.TRANSFER_PUBLIC | typeof TRANSACTION_TYPE.TRANSFER_PRIVATE;
  }
>;

export type TransactionSelfTransfer = Extract<
  Transaction,
  {
    mode:
      | typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
      | typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;
  }
>;

export type TransactionPublic = Extract<
  Transaction,
  {
    mode:
      | typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
      | typeof TRANSACTION_TYPE.TRANSFER_PUBLIC;
  }
>;

export type TransactionPrivate = Extract<
  Transaction,
  {
    mode:
      | typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
      | typeof TRANSACTION_TYPE.TRANSFER_PRIVATE;
  }
>;
