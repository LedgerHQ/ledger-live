import BigNumber from "bignumber.js";
import type { TxDataNotSupported } from "@ledgerhq/coin-framework/api/types";
import type { TRANSACTION_TYPE } from "../constants";
import type {
  AleoJWT,
  AleoRecordScannerStatusResponse,
  AleoPublicTransaction,
  AleoPublicTransactionDetailsResponse,
  AleoPrivateRecord,
} from "./api";
import type { AleoDecryptedRecordResponse } from "./sdk";

export interface AleoUnspentRecord extends AleoPrivateRecord {
  microcredits: string;
  decryptedData: AleoDecryptedRecordResponse;
}

export type EnrichedTransaction = {
  rawTx: AleoPublicTransaction;
  details: AleoPublicTransactionDetailsResponse | null;
};

export type EnrichedPrivateRecord = {
  rawRecord: AleoPrivateRecord;
  details: AleoPublicTransactionDetailsResponse;
  sender: string;
  recipient: string;
  value: BigNumber;
};

export interface ProvableApi {
  apiKey?: string;
  consumerId?: string;
  jwt?: AleoJWT;
  uuid?: string;
  scannerStatus?: AleoRecordScannerStatusResponse;
}

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

export type AleoTransactionIntentData =
  | TxDataNotSupported
  | {
      type: "fee_public";
      priorityFee?: number;
      executionId: string;
    };

export interface FormattedSyncInfo {
  time: string | null;
  date: string | null;
}
