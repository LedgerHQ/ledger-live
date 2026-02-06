import { AleoPrivateRecord } from "./api";

export interface AleoUnspentRecord extends AleoPrivateRecord {
  plaintext: string;
}
