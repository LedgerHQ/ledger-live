import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
import type { TransferStep } from "./gateway";

export { AccountOnboardStatus };

export enum AuthorizeStatus {
  INIT,
  PREPARE,
  SIGN,
  SUBMIT,
  SUCCESS,
  ERROR,
}

export type CantonOnboardProgress = {
  status: AccountOnboardStatus;
};

export type CantonOnboardResult = {
  partyId: string;
  account: Account;
};

export type CantonAuthorizeProgress = {
  status: AuthorizeStatus;
};

export type CantonAuthorizeResult = {
  isApproved: boolean;
};

export interface PrepareTransactionRequest {
  type: "transfer-pre-approval-proposal";
  receiver: string;
}

export interface PrepareTransactionResponse {
  serialized: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any; // JSON representation
  hash: string;
  step: TransferStep;
}

export interface PreApprovalResult {
  isApproved: boolean;
  submissionId: string;
  updateId: string;
}
