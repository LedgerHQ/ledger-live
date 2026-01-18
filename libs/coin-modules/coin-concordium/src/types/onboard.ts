import type { HexString } from "@ledgerhq/concordium-sdk-adapter";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { SessionTypes, ISignClient } from "@walletconnect/types";
import { AccountOnboardStatus } from "@ledgerhq/types-live";
import type { ConcordiumNetwork } from "./config";
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
 * Credential deployment transaction for submission.
 *
 * Design Decision: randomness is stored as CommitmentsRandomness object internally.
 * Only stringify to JSON when serializing for external storage or API calls that require string format.
 * This avoids unnecessary JSON.parse/stringify cycles in the onboarding flow.
 */
export type CredentialDeploymentTransaction = {
  expiry: bigint;
  unsignedCdiStr: string;
  randomness: CommitmentsRandomness;
};

export type PrepareCredentialDeploymentResponse = {
  transaction: CredentialDeploymentTransaction;
  accountAddress: string;
  credId?: string;
};

/*
 * Type definitions matching IDApp SDK
 */

export interface SerializedCredentialDeploymentDetails {
  expiry: number; // epoch seconds
  unsignedCdiStr: string; // JSON string of UnsignedCredentialDeploymentInformation
  randomness: CommitmentsRandomness;
}

export interface CommitmentsRandomness {
  idCredSecRand: string;
  prfRand: string;
  credCounterRand: string;
  maxAccountsRand: string;
  attributesRand: Record<string, string>;
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

export interface SignedCredentialDeploymentTransaction {
  credentialDeploymentTransaction: CredentialDeploymentTransaction;
  signature: HexString;
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
  serializedCredentialDeploymentTransaction: SerializedCredentialDeploymentDetails;
  accountAddress: string;
  // Optional identity/credential indices for verify address support
  identityIndex?: number;
  credNumber?: number;
}

export interface IDAppCreateAccountResponse {
  status: IDAppResponseStatus;
  message: IDAppCreateAccountResponseMessage | IDAppError;
}

/**
 * Type representing WalletConnect SignClient
 * Using ISignClient from @walletconnect/types which is CommonJS-compatible
 */
export type SignClient = ISignClient;

/**
 * WalletConnect context interface for Concordium onboarding
 * This allows the bridge layer to use WalletConnect without directly importing renderer services
 */
export interface ConcordiumWalletConnectContext {
  getClient(): Promise<SignClient>;

  isSessionValid(session: SessionTypes.Struct): boolean;

  getSession(network: ConcordiumNetwork): Promise<SessionTypes.Struct | null>;

  disconnectAllSessions(): Promise<void>;

  getCreateAccountMessage(publicKey: string, reason: string): IDAppCreateAccountMessage;

  requestCreateAccount(params: IDAppCreateAccountParams): Promise<IDAppCreateAccountResponse>;

  submitCCDTransaction(
    credentialDeploymentTransaction: CredentialDeploymentTransaction,
    signature: string,
    currency: CryptoCurrency,
  ): Promise<string>;

  initiatePairing(
    network: ConcordiumNetwork,
    chainId: string,
  ): Promise<{
    uri?: string;
    approval: () => Promise<SessionTypes.Struct>;
  }>;
}
