import type { CredentialDeploymentTransaction as WebSDKCredentialDeploymentTransaction } from "@ledgerhq/concordium-sdk-adapter";
import { AccountOnboardStatus } from "@ledgerhq/types-live";
import { ConcordiumAccount } from "./bridge";

export { AccountOnboardStatus };

export enum ConcordiumPairingStatus {
  INIT = "INIT",
  PREPARE = "PREPARE",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export type ConcordiumPairingProgress = {
  sessionTopic?: string | null;
  status: ConcordiumPairingStatus;
  walletConnectUri?: string | null;
};

export type ConcordiumOnboardProgress = {
  status: AccountOnboardStatus;
};

export type ConcordiumOnboardResult = {
  account: ConcordiumAccount;
};

/**
 * Credential deployment transaction (re-exported from SDK).
 *
 * Structure:
 * - expiry: TransactionExpiry object
 * - unsignedCdi: Parsed UnsignedCredentialDeploymentInformation object
 * - randomness: CommitmentsRandomness object
 *
 * Design Decision: After deserialization, we work with parsed objects internally.
 * This avoids unnecessary JSON.parse/stringify cycles in the onboarding flow.
 */
export type CredentialDeploymentTransaction = WebSDKCredentialDeploymentTransaction;

export type PrepareCredentialDeploymentResponse = {
  transaction: CredentialDeploymentTransaction;
  accountAddress: string;
  credId?: string;
};

/*
 * Type definitions matching IDApp SDK
 */

export interface SerializedCredentialDeploymentTransaction {
  expiry: number; // epoch seconds
  unsignedCdiStr: string; // JSON string of UnsignedCredentialDeploymentInformation
  randomness: CommitmentsRandomness;
}

/**
 * Commitments randomness from IDApp - matches SDK CommitmentsRandomness structure
 * AttributeKey is re-exported from @concordium/web-sdk via concordium-sdk-adapter
 */
export interface CommitmentsRandomness {
  idCredSecRand: string;
  prfRand: string;
  credCounterRand: string;
  maxAccountsRand: string;
  attributesRand: Record<string, string>; // Compatible with Record<AttributeKey, string> at runtime
}

export interface IdOwnershipProofs {
  challenge: string;
  commitments: string;
  credCounterLessThanMaxAccounts: string;
  proofIdCredPub: Record<string, string>;
  proofIpSig: string;
  proofRegId: string;
  sig: string;
}

export interface CredentialDeploymentCommitments {
  cmmPrf: string;
  cmmCredCounter: string;
  cmmIdCredSecSharingCoeff: string[];
  cmmAttributes: Partial<Record<string, string>>;
  cmmMaxAccounts: string;
}

export interface UnsignedCredentialDeploymentInformation {
  credId: string;
  ipIdentity: number;
  credentialPublicKeys: unknown; // ICredentialPublicKeys - complex structure
  policy: unknown; // ICredentialPolicy - complex structure
  revocationThreshold: number;
  arData: Record<string, unknown>; // ChainArData - complex structure
  commitments: CredentialDeploymentCommitments;
  proofs: IdOwnershipProofs;
}

export interface IDAppCreateAccountMessage {
  publicKey: string;
  reason: string;
}

export interface IDAppCreateAccountParams {
  topic: string;
  chainId: string;
  method: string;
  params: { message: IDAppCreateAccountMessage };
}

export enum IDAppErrorCode {
  AccountNotFound = 1,
  AccountCreationFailed = 2,
  NetworkError = 3,
  InvalidInput = 4,
  Unauthorized = 5,
  Timeout = 6,
  DuplicateAccountCreationRequest = 7,
  RequestRejected = 8,
  UnknownError = 99,
}

export interface IDAppError {
  code: IDAppErrorCode;
  details?: string;
}

export declare enum IDAppResponseStatus {
  SUCCESS = "success",
  ERROR = "error",
}

export interface IDAppCreateAccountResponseMessage {
  serializedCredentialDeploymentTransaction: SerializedCredentialDeploymentTransaction;
  accountAddress: string;
  identityIndex?: number;
  credNumber?: number;
}

export interface IDAppCreateAccountResponse {
  status: IDAppResponseStatus;
  message: IDAppCreateAccountResponseMessage | IDAppError;
}
