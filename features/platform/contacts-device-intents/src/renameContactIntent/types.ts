import type { GroupHandle, JobStateBase, Proof } from "../types";

export type RenameContactIntentInput = {
  previousContactName: string;
  newContactName: string;
  groupHandle: GroupHandle;
  hmacProof: Proof;
};

export type RenameContactResult = {
  previousContactName: string;
  contactName: string;
  groupHandle: GroupHandle;
  hmacProof: Proof;
};

export type RenameContactJobState =
  | JobStateBase
  | {
      type: "completed";
      result: RenameContactResult;
    };
