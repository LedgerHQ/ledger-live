import { AleoPrivateRecord } from "./api";

export interface AleoUnspentRecord extends AleoPrivateRecord {
  microcredits: string;
  plaintext: string;
}
