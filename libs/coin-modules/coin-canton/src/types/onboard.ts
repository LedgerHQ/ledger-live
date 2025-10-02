import { Account } from "@ledgerhq/types-live";

export enum OnboardStatus {
  INIT,
  PREPARE,
  SIGN,
  SUBMIT,
  SUCCESS,
  ERROR,
}

export enum AuthorizeStatus {
  INIT,
  PREPARE,
  SIGN,
  SUBMIT,
  SUCCESS,
  ERROR,
}

export type CantonOnboardProgress = {
  status: OnboardStatus;
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

/**
 * Types for Canton Gateway Transaction API
 * Based on the API endpoints in canton-gateway
 */

export interface PrepareTransactionRequest {
  type: "transfer-pre-approval-proposal";
  receiver: string;
}

export interface PrepareTransactionResponse {
  serialized: string; // Hex-encoded serialized protobuf
  json: any; // JSON representation
  hash: string; // Transaction hash for signing
}

export interface SubmitTransactionRequest {
  serialized: string; // Hex-encoded serialized protobuf
  signature: string; // Hex-encoded signature
}

export interface SubmitTransactionResponse {
  submission_id: string;
  update_id: string;
}

export interface PreApprovalResult {
  isApproved: boolean;
  submissionId: string;
  updateId: string;
}
