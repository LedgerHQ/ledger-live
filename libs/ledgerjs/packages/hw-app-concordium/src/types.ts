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
 * Account transaction format expected by Ledger device.
 *
 * This is the hw-app format, not the SDK AccountTransaction type.
 * Use coin-concordium/hw-serialization to transform SDK → hw-app format.
 */
export interface AccountTransaction {
  sender: Buffer; // Raw address bytes (32 bytes), not Base58 string
  nonce: bigint; // Sequence number as primitive bigint
  expiry: bigint; // Epoch seconds as primitive bigint
  energyAmount: bigint; // Energy limit as primitive bigint
  transactionType: number; // Transaction type enum value
  payload: Buffer; // Pre-serialized transaction payload (type-specific)
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
