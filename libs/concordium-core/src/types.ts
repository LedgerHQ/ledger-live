import type { AccountAddress as AccountAddressType } from "./address";
export { AccountAddress } from "./address";

/**
 * ID ownership proofs from ID App.
 * Must be serialized when building the message hash for device signing.
 */
export interface IdOwnershipProofs {
  sig: string; // IP signature (hex string, 64 bytes = 128 hex chars)
  commitments: string; // Commitments (hex string)
  challenge: string; // Challenge (hex string)
  proofIdCredPub: Record<string, string>; // AR index -> proof hex string
  proofIpSig: string; // IP signature proof (hex string)
  proofRegId: string; // Registration ID proof (hex string)
  credCounterLessThanMaxAccounts: string; // Credential counter proof (hex string)
}

/**
 * Credential deployment transaction format expected by Ledger device.
 *
 * This is the hw-app format, not the SDK CredentialDeploymentTransaction type.
 * Use coin-concordium/hw-serialization to transform SDK → hw-app format.
 */
export interface CredentialDeploymentTransaction {
  credentialPublicKeys: {
    keys: Record<string, { schemeId: string; verifyKey: string }>; // String key indices, converted to numbers during serialization
    threshold: number; // Signature threshold
  };
  credId: string; // Credential ID as hex string (48 bytes = 96 hex chars)
  ipIdentity: number; // Identity provider index
  revocationThreshold: number; // Anonymity revocation threshold
  arData: Record<string, { encIdCredPubShare: string }>; // Anonymity revoker data, indexed by AR identity
  policy: {
    validTo: string; // YearMonth format (YYYYMM)
    createdAt: string; // YearMonth format (YYYYMM)
    revealedAttributes: Record<string, string>; // Attribute tag → value mapping
  };
  proofs: IdOwnershipProofs; // ID ownership proofs object (will be serialized by hw-app)
  expiry: bigint; // Transaction expiry as epoch seconds
}

/**
 * Address response from device
 */
export interface Address {
  address: string; // Base58 address or public key (hex) depending on display mode
  publicKey: string; // Ed25519 public key as hex string
}

/**
 * Verify address response from device
 */
export interface VerifyAddressResponse {
  status: string; // Status code (typically "9000" for success)
  address?: string; // Verified Base58 address displayed on device
  deviceCredId?: string; // Credential ID computed by device (hex string)
  devicePrfKey?: string; // PRF key computed by device (hex string)
}

/**
 * Cryptographic signature scheme identifier
 */
export enum SchemeId {
  Ed25519 = 0,
}

/**
 * Transaction type enum.
 * Values match Concordium protocol transaction type discriminators.
 */
export enum TransactionType {
  Transfer = 3,
  TransferWithMemo = 22,
}

/**
 * Transfer transaction payload (simple transfer without memo).
 *
 * Used for basic CCD transfers between accounts.
 */
export interface TransferPayload {
  /** Recipient's Concordium address */
  toAddress: AccountAddressType;
  /** Transfer amount in microCCD (1 CCD = 1,000,000 microCCD) */
  amount: bigint;
}

/**
 * Transfer with memo transaction payload.
 *
 * Used for CCD transfers that include a message/memo.
 * The memo must be CBOR-encoded using encodeMemoToCbor() before inclusion.
 */
export interface TransferWithMemoPayload {
  /** Recipient's Concordium address */
  toAddress: AccountAddressType;
  /** Transfer amount in microCCD (1 CCD = 1,000,000 microCCD) */
  amount: bigint;
  /** CBOR-encoded memo (use encodeMemoToCbor to encode UTF-8 string) */
  memo: Buffer;
}

/**
 * Union type of all supported transaction payloads.
 */
export type TransactionPayload = TransferPayload | TransferWithMemoPayload;

/**
 * Transaction
 *
 * This is the hw-app format that owns transaction structure definition.
 * Used by signTransfer() and signTransferWithMemo() methods.
 *
 * The type field determines which payload structure is expected:
 * - TransactionType.Transfer → TransferPayload
 * - TransactionType.TransferWithMemo → TransferWithMemoPayload
 */
export interface Transaction {
  header: {
    /** Sender's Concordium address */
    sender: AccountAddressType;
    /** Account nonce / sequence number */
    nonce: bigint;
    /** Transaction expiry time (epoch seconds) */
    expiry: bigint;
    /** Maximum energy (gas) for transaction execution */
    energyAmount: bigint;
  };
  /** Transaction type discriminator */
  type: TransactionType;
  /** Type-safe payload (structure depends on type field) */
  payload: TransactionPayload;
}

/**
 * Signing result with both signature and serialized transaction.
 */
export interface SigningResult {
  signature: string; // Transaction signature (hex string)
  serialized: string; // Serialized transaction for network submission (hex string)
}
