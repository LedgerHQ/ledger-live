export enum OnboardStatus {
  INIT,
  PREPARE,
  SIGN,
  SUBMIT,
  SUCCESS,
  ERROR,
}

export enum PreApprovalStatus {
  INIT,
  PREPARE,
  SIGN,
  SUBMIT,
  SUCCESS,
  ERROR,
}

export type CantonOnboardProgress = {
  status: OnboardStatus;
  message?: string;
};

export type CantonOnboardResult = {
  partyId: string;
  publicKey: string;
  address: string;
  transactionHash: string;
};

export type CantonPreApprovalProgress = {
  status: PreApprovalStatus;
  message?: string;
};

export type CantonPreApprovalResult = {
  approved: boolean;
  signature: string;
  transactionId?: string;
  message?: string;
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
  submissionId?: string;
  // Add other fields as they become available in the API
}

export interface PreApprovalResult {
  approved: boolean;
  transactionId?: string;
  message?: string;
}
