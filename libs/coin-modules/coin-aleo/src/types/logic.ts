import type {
  AleoJWT,
  AleoRecordScannerStatusResponse,
  AleoPublicTransaction,
  AleoPublicTransactionDetailsResponse,
} from "./api";

export type EnrichedTransaction = {
  rawTx: AleoPublicTransaction;
  details: AleoPublicTransactionDetailsResponse | null;
};
export interface ProvableApi {
  apiKey?: string;
  consumerId?: string;
  jwt?: AleoJWT;
  uuid?: string;
  scannerStatus?: AleoRecordScannerStatusResponse;
}
