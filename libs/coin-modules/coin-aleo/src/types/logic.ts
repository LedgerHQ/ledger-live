import { AleoJWT, AleoPrivateRecord, AleoRecordScannerStatusResponse } from "./api";

export interface AleoUnspentRecord extends AleoPrivateRecord {
  microcredits: string;
  plaintext: string;
}

export interface ProvableApi {
  apiKey: string | undefined;
  consumerId: string | undefined;
  jwt: AleoJWT | undefined;
  uuid: string | undefined;
  scannerStatus?: AleoRecordScannerStatusResponse;
}
