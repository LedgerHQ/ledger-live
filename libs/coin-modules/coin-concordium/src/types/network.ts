/**
 * Response from /v0/consensusInfo
 * Subset of Concordium node's GetConsensusInfo relevant for wallet operations
 */
export interface ConsensusInfoResponse {
  bestBlock: string;
  bestBlockHeight: number;
  genesisBlock: string;
  genesisTime: string;
  lastFinalizedBlock: string;
  lastFinalizedBlockHeight: number;
  lastFinalizedTime?: string;
  epochDuration: number;
  protocolVersion: number;
  genesisIndex: number;
  currentEraGenesisBlock: string;
  currentEraGenesisTime: string;
  slotDuration?: number;
  concordiumBFTStatus?: {
    currentTimeoutDuration: number;
    currentRound: number;
    currentEpoch: number;
    triggerBlockTime: string;
  };
}

/**
 * Response from /v0/blockInfo/{blockHash}
 */
export interface BlockInfoResponse {
  blockHash: string;
  blockHeight: number;
  blockSlotTime: string;
  blockParent: string;
  blockBaker: number | null;
  finalized: boolean;
  transactionCount: number;
  transactionEnergyCost: number;
  transactionsSize: number;
  genesisIndex: number;
  eraBlockHeight: number;
  protocolVersion: number;
  round?: number;
  epoch?: number;
}

/**
 * Response from /v0/blocksAtHeight/{blockHeight}
 * Returns an array of block hashes at the given height.
 */
export type BlocksAtHeightResponse = string[];

/**
 * Concordium address as serialized by the node inside transaction events.
 * Account addresses carry a base58 string; contract addresses carry an index/subindex pair.
 */
export type ConcordiumEventAddress =
  | { type: "AddressAccount"; address: string }
  | { type: "AddressContract"; address: { index: number; subindex: number } };

/**
 * A single event inside a successful transaction result. Only transfer-related
 * tags are modelled explicitly; every other event is kept as an opaque tagged
 * object so the tag-based mapper can ignore it (PLT/staking tags added later).
 */
export interface BlockTransactionEvent {
  tag: string;
  [key: string]: unknown;
}

/**
 * A native CCD transfer event.
 */
export interface TransferredEvent extends BlockTransactionEvent {
  tag: "Transferred";
  amount: string; // microCCD as a string
  from: ConcordiumEventAddress;
  to: ConcordiumEventAddress;
}

/**
 * A memo event. A `transferWithMemo` transaction emits both a `Transferred` and a
 * separate `TransferMemo` event within the same summary; the memo is hex-encoded CBOR.
 */
export interface TransferMemoEvent extends BlockTransactionEvent {
  tag: "TransferMemo";
  memo: string; // hex-encoded CBOR
}

/**
 * Outcome of a transaction in a block. Rejected transactions still paid fees but
 * produced no effective balance changes.
 */
export type BlockTransactionResult =
  | { outcome: "success"; events: BlockTransactionEvent[] }
  | { outcome: "reject"; rejectReason?: { tag: string; contents?: unknown } };

/**
 * A transaction summary as returned by /v0/blockTransactionEvents/{blockHash}.
 * This is the raw node `TransactionSummary` shape (structured, tagged events),
 * distinct from the flattened /v3/accTransactions shape used by listOperations.
 */
export interface BlockTransactionSummary {
  hash: string;
  sender: string | null;
  cost: string; // microCCD as a string
  energyCost?: number;
  index?: number;
  type?: { type: string; contents?: string };
  result: BlockTransactionResult;
}

/**
 * Response from /v0/blockTransactionEvents/{blockHash}.
 * An array of transaction summaries; empty for blocks with no transactions.
 */
export type BlockTransactionEventsResponse = BlockTransactionSummary[];

export interface TransactionQueryParams {
  limit?: number;
  order?: "a" | "d"; // ascending or descending
  from?: string; // transaction ID to start from (exclusive cursor)
  includeRewards?: boolean;
  includeRawRejectReason?: boolean;
  onlyEncrypted?: boolean;
  blockTimeFrom?: number; // Unix seconds
  blockTimeTo?: number; // Unix seconds
  blockHeightFrom?: number; // inclusive lower bound
  blockHeightTo?: number; // inclusive upper bound
}

export interface GetTransactionCostParams {
  numSignatures: number;
  memoSize?: number;
}

/**
 * Request payload for submitting a transfer transaction
 * PUT /v0/submitTransfer/
 */
export interface SubmitTransferData {
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
 */
export interface SubmitCredentialData {
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
  type: string; // e.g., "transfer", "transferWithMemo", "bakingReward", "encryptedTransfer", etc.
  outcome: "success" | "reject";
  description?: string;
  events?: string[];
  transferAmount?: string;
  transferSource?: string;
  transferDestination?: string;
  memo?: string; // Present for transferWithMemo transactions
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
  blockHeight: number; // Absolute block height
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
export interface TransactionsResponse {
  transactions: WalletProxyTransaction[];
  from: number;
  count: number;
  limit: number;
  order: "ascending" | "descending";
}

// ============================================================================
// WalletConnect / IDApp SDK Types
// ============================================================================

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

export enum IDAppResponseStatus {
  SUCCESS = "success",
  ERROR = "error",
}

export interface CommitmentsRandomness {
  idCredSecRand: string;
  prfRand: string;
  credCounterRand: string;
  maxAccountsRand: string;
  attributesRand: Record<string, string>;
}

export interface SerializedCredentialDeploymentTransaction {
  expiry: number;
  unsignedCdiStr: string;
  randomness: CommitmentsRandomness;
}

export interface IDAppCreateAccountMessage {
  publicKey: string;
  reason: string;
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

export interface IDAppCreateAccountParams {
  topic: string;
  chainId: string;
  params: { message: IDAppCreateAccountMessage };
}
