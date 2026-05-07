import BigNumber from "bignumber.js";
import type {
  MemoNotSupported,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import type { TRANSACTION_TYPE } from "../constants";
import type {
  AleoRecordScannerStatusResponse,
  AleoPublicTransactionDetailsResponse,
  AleoPrivateRecord,
} from "./api";
import type { AleoDecryptedRecordResponse } from "./sdk";

export interface AleoUnspentRecord extends AleoPrivateRecord {
  microcredits: string;
  decryptedData: AleoDecryptedRecordResponse;
}

export type EnrichedPrivateRecord = {
  rawRecord: AleoPrivateRecord;
  details: AleoPublicTransactionDetailsResponse;
  sender: string;
  recipient: string;
  value: BigNumber;
};

export interface ProvableApi {
  uuid?: string;
  scannerStatus?: AleoRecordScannerStatusResponse;
}

export type RecordPickingStrategy = "manual" | "auto";

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

export type AleoTransactionIntentData =
  | TxDataNotSupported
  | {
      type: typeof TRANSACTION_TYPE.TRANSFER_PRIVATE;
      records: AleoDecryptedRecordResponse[];
    }
  | {
      type: typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
      records: AleoDecryptedRecordResponse[];
    }
  | {
      type: "fee_public";
      priorityFee?: bigint;
      executionId: string;
    }
  | {
      type: "fee_private";
      priorityFee?: bigint;
      executionId: string;
      record: AleoDecryptedRecordResponse;
    };

export type AleoTransactionIntent = TransactionIntent<MemoNotSupported, AleoTransactionIntentData>;

export interface SignedAleoTransaction {
  authorization: string;
  feeAuthorization: string | null;
}
