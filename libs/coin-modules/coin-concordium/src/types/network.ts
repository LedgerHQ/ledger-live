import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { SessionTypes, ISignClient } from "@walletconnect/types";
import type { ConcordiumNetwork } from "./config";
import type {
  CreateAccountCreationRequestMessage,
  CredentialDeploymentTransaction,
  IDAppCreateAccountCreationResponse,
} from "./onboard";

/**
 * Identity provider information from wallet-proxy
 * Contains metadata about the identity provider including verification URLs
 */
export interface IdentityProvider {
  ipIdentity: number;
  ipDescription: {
    name: string;
    url: string;
    description: string;
  };
  issuanceStart: string; // URL to start identity issuance
  metadata: {
    issuanceStart: string;
    recoveryStart: string;
  };
  ipInfo: {
    ipIdentity: number;
    ipDescription: {
      name: string;
      url: string;
      description: string;
    };
    ipVerifyKey: string;
    ipCdiVerifyKey: string;
  };
  arsInfos: Record<
    number,
    {
      arIdentity: number;
      arDescription: {
        name: string;
        url: string;
        description: string;
      };
      arPublicKey: string;
    }
  >;
}

export interface TransactionQueryParams {
  limit?: number;
  order?: "a" | "d"; // ascending or descending
  from?: string; // transaction ID to start from
  includeRewards?: boolean;
  includeRawRejectReason?: boolean;
  onlyEncrypted?: boolean;
  blockTimeFrom?: string; // ISO 8601 timestamp
  blockTimeTo?: string; // ISO 8601 timestamp
}

export type TransactionType =
  | "simpleTransfer"
  | "encryptedTransfer"
  | "transferWithMemo"
  | "registerDelegation"
  | "updateContract";

/**
 * Request payload for submitting a transfer transaction
 * POST /v0/submitTransfer
 */
export interface SubmitTransferRequest {
  transaction: string; // hex-encoded transaction body
  signatures: {
    [credentialIndex: string]: {
      [keyIndex: string]: string; // hex signature
    };
  };
}

/**
 * Request payload for submitting a credential deployment transaction
 * PUT /v0/submitCredential
 *
 * The wallet-proxy expects a versioned payload structure:
 * {
 *   "v": 0,
 *   "value": {
 *     "credential": { ... },
 *     "messageExpiry": <bigint>
 *   }
 * }
 */
export interface SubmitCredentialRequest {
  v: number; // Version, should be 0
  value: {
    credential: {
      type: "initial" | "normal";
      contents: {
        ipIdentity: number;
        policy: {
          validTo: string;
          createdAt: string;
          revealedAttributes: Record<string, unknown>;
        };
        credentialPublicKeys: {
          keys: Record<
            string,
            {
              schemeId: string;
              verifyKey: string;
            }
          >;
          threshold: number;
        };
        // For initial credentials: regId and sig are required
        // For normal credentials: credId, proofs, arData, and revocationThreshold are required
        credId?: string;
        regId?: string;
        sig?: string; // Signature for initial credentials (hex string)
        revocationThreshold?: number;
        arData?: Record<string, { encIdCredPubShare: string }>;
        proofs?: string; // hex-encoded proofs for normal credentials
      };
    };
    messageExpiry: number; // Transaction expiry as number (Word64)
  };
}

export type PublicKeyAccountsResponse = Array<{
  address: string;
  credential_index: number;
  is_simple_account: boolean;
  key_index: number;
  public_key: {
    schemeId: string;
    verifyKey: string;
  };
}>;

/**
 * Response from /v2/accBalance/{address}
 * Wallet-proxy returns balance information including CCD balance, PLT balance, and cooldowns
 */
export interface AccountBalanceResponse {
  finalizedBalance: {
    accountAmount: string; // Total balance in microCCD
    accountAtDisposal: string; // Available balance in microCCD (after cooldowns/reserves)
    accountCooldowns: Array<{
      timestamp: string;
      amount: string;
    }>;
    accountIndex: number;
    accountNonce: number;
    accountReleaseSchedule: {
      schedule: Array<{
        timestamp: string;
        amount: string;
      }>;
      total: string;
    };
    accountTokens: unknown[];
    accountEncryptedAmount?: {
      incomingAmounts: unknown[];
      selfAmount: string;
      startIndex: number;
    };
  };
}

/**
 * Wallet-proxy transaction origin
 */
export interface WalletProxyTransactionOrigin {
  type: "self" | "account" | "reward" | "contract";
  address?: string;
}

/**
 * Wallet-proxy transaction details (varies by transaction type)
 */
export interface WalletProxyTransactionDetails {
  type: string; // e.g., "transfer", "bakingReward", "encryptedTransfer", etc.
  outcome: "success" | "reject";
  description?: string;
  events?: string[];
  transferAmount?: string;
  transferSource?: string;
  transferDestination?: string;
  [key: string]: unknown;
}

/**
 * Wallet-proxy transaction response structure
 * Based on actual /v3/accTransactions/{address} API response
 */
export interface WalletProxyTransaction {
  id: number;
  blockTime: number; // Unix timestamp with decimals
  blockHash?: string;
  origin: WalletProxyTransactionOrigin;
  energy?: number;
  cost?: number; // Transaction cost in microCCD
  subtotal?: number;
  transactionHash: string;
  details: WalletProxyTransactionDetails;
  total: number; // Net amount (positive for incoming, negative for outgoing)
}

/**
 * Response from /v3/accTransactions/{address}
 */
export interface AccountTransactionsResponse {
  transactions: WalletProxyTransaction[];
  from: number;
  count: number;
  limit: number;
  order: "ascending" | "descending";
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
  getSession(network: ConcordiumNetwork): Promise<SessionTypes.Struct | null>;

  request(params: {
    topic: string;
    chainId: string;
    method: string;
    params: { message: unknown };
  }): Promise<unknown>;

  requestAccountCreation(params: {
    topic: string;
    chainId: string;
    method: string;
    params: { message: unknown };
  }): Promise<IDAppCreateAccountCreationResponse>;

  signCredentialTransaction(
    transaction: CredentialDeploymentTransaction,
    signingKey: string,
  ): Promise<{
    credentialDeploymentTransaction: CredentialDeploymentTransaction;
    signature: string;
  }>;

  submitCCDTransaction(
    credentialDeploymentTransaction: CredentialDeploymentTransaction,
    signature: string,
    currency: CryptoCurrency,
  ): Promise<string>;

  getCreateAccountCreationRequest(
    publicKey: string,
    reason: string,
  ): CreateAccountCreationRequestMessage;

  initiatePairing(
    network: ConcordiumNetwork,
    chainId: string,
  ): Promise<{
    uri?: string;
    approval: () => Promise<SessionTypes.Struct>;
  }>;

  disconnectAllSessions(): Promise<void>;
}
