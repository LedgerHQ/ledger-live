import { SignerContext } from "@ledgerhq/coin-framework/signer";
import type {
  HexString,
  CommitmentsRandomness as WebSDKCommitmentsRandomness,
  CredentialDeploymentTransaction as WebSDKCredentialDeploymentTransaction,
  CredentialPublicKeys,
  Policy,
} from "@ledgerhq/concordium-sdk-adapter";
import {
  TransactionExpiry,
  signCredentialTransaction as webSDKSignCredentialTransaction,
  serializeCredentialDeploymentPayload,
} from "@ledgerhq/concordium-sdk-adapter";
import type { AttributeKey, ChainArData } from "@ledgerhq/concordium-sdk-adapter";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import JSONbig from "json-bigint";
import type { ConcordiumSigner } from "../types";
import type {
  CreateAccountCreationRequestMessage,
  CredentialDeploymentTransaction,
  SerializedCredentialDeploymentDetails,
  SignedCredentialDeploymentTransaction,
  UnsignedCredentialDeploymentInformation,
} from "../types/onboard";
import { getAccountInfo, sendCredentialDeploymentTransaction } from "./grpcClient";
export { getConcordiumNetwork } from "./utils";

function isICredentialPublicKeys(value: unknown): value is CredentialPublicKeys {
  if (typeof value !== "object" || value === null) return false;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const obj = value as Record<string, unknown>;
  return (
    "keys" in obj &&
    "threshold" in obj &&
    typeof obj.threshold === "number" &&
    typeof obj.keys === "object" &&
    obj.keys !== null
  );
}

function isICredentialPolicy(value: unknown): value is Policy {
  if (typeof value !== "object" || value === null) return false;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const obj = value as Record<string, unknown>;
  return (
    "validTo" in obj &&
    "createdAt" in obj &&
    "revealedAttributes" in obj &&
    typeof obj.validTo === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.revealedAttributes === "object" &&
    obj.revealedAttributes !== null
  );
}

function isChainArData(value: unknown): value is ChainArData {
  if (typeof value !== "object" || value === null) return false;
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const obj = value as Record<string, unknown>;
  return "encIdCredPubShare" in obj && typeof obj.encIdCredPubShare === "string";
}

function isRecordOfChainArData(
  value: Record<string, unknown>,
): value is Record<string, ChainArData> {
  return Object.values(value).every(isChainArData);
}

function isRecordOfAttributeKeyString(
  value: Partial<Record<string, string>> | undefined,
): value is Record<AttributeKey, string> {
  // Accept any Record<string, string> as AttributeKey - runtime validation happens at SDK level
  // TypeScript can't validate AttributeKey union at runtime, so we accept the structure
  // For empty objects, return empty record cast as Record<AttributeKey, string>
  if (!value || Object.keys(value).length === 0) {
    return true; // Empty object is valid (will be cast to Record<AttributeKey, string>)
  }
  return typeof value === "object" && value !== null;
}

/**
 * Deserialize credential deployment transaction from IDApp SDK format to hw-app-concordium format
 *
 * IMPORTANT: Commitments are optional and NOT used for signing.
 * The signing digest (serializeCredentialDeploymentValues) only uses:
 * credentialPublicKeys, credId, ipIdentity, revocationThreshold, arData, policy, and proofs.
 * Commitments are only needed when submitting the transaction, but the full unsignedCdiStr
 * contains them for that purpose.
 *
 * Aligned with @concordium/id-app-sdk v0.1.4 behavior:
 * - Simply parses unsignedCdiStr
 * - Uses commitments if available, otherwise omits them (not used for signing)
 * - Validates structure and converts to hw-app-concordium format
 */
export function deserializeCredentialDeployment(
  serialized: SerializedCredentialDeploymentDetails,
): WebSDKCredentialDeploymentTransaction {
  let unsignedCdi: UnsignedCredentialDeploymentInformation;
  try {
    unsignedCdi = JSONbig.parse(serialized.unsignedCdiStr);
  } catch (error) {
    throw new Error(
      `Failed to parse unsignedCdiStr: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!unsignedCdi || typeof unsignedCdi !== "object") {
    throw new Error("Invalid unsignedCdi structure: parsed value is not an object");
  }

  if (!isICredentialPublicKeys(unsignedCdi.credentialPublicKeys)) {
    throw new Error("Invalid credentialPublicKeys structure");
  }
  if (!isICredentialPolicy(unsignedCdi.policy)) {
    throw new Error("Invalid policy structure");
  }
  if (!isRecordOfChainArData(unsignedCdi.arData)) {
    throw new Error("Invalid arData structure");
  }

  // Commitments are optional - they are not used for signing (serializeCredentialDeploymentValues
  // only uses credentialPublicKeys, credId, ipIdentity, revocationThreshold, arData, policy, and proofs).
  // Commitments are only needed when submitting the transaction, but the full unsignedCdiStr contains
  // them for that purpose.
  const commitments =
    unsignedCdi.commitments && typeof unsignedCdi.commitments === "object"
      ? unsignedCdi.commitments
      : undefined;

  let cmmAttributes: Partial<Record<AttributeKey, string>> = {};
  if (commitments && commitments.cmmAttributes) {
    if (!isRecordOfAttributeKeyString(commitments.cmmAttributes)) {
      throw new Error("Invalid cmmAttributes structure");
    }
    cmmAttributes = commitments.cmmAttributes;
  }

  // Keep proofs as object (IdOwnershipProofs) - serialization will handle conversion to hex when needed
  // If proofs is already a hex string, we need to keep it as-is for backward compatibility
  // but ideally it should be an object matching IdOwnershipProofs format
  if (typeof unsignedCdi.proofs !== "object" || unsignedCdi.proofs === null) {
    throw new Error(
      `Invalid proofs structure: expected object with IdOwnershipProofs format, got ${typeof unsignedCdi.proofs}`,
    );
  }

  // Ensure policy.revealedAttributes is a proper object (not null/undefined)
  const policy = unsignedCdi.policy as Policy;
  const revealedAttributes =
    policy?.revealedAttributes && typeof policy.revealedAttributes === "object"
      ? policy.revealedAttributes
      : {};

  // Create a clean policy object with guaranteed structure
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const cleanPolicy: Policy = {
    validTo: policy?.validTo || "",
    createdAt: policy?.createdAt || "",
    revealedAttributes: revealedAttributes as Record<AttributeKey, string>,
  };

  // Ensure credentialPublicKeys.keys uses numeric keys (hw-app-concordium expects number keys)
  const credentialPublicKeys = unsignedCdi.credentialPublicKeys as CredentialPublicKeys;
  const normalizedCredentialPublicKeys: CredentialPublicKeys = {
    keys: Object.fromEntries(
      Object.entries(credentialPublicKeys.keys || {}).map(([key, value]) => [
        parseInt(key, 10),
        value,
      ]),
    ) as { [key: number]: { schemeId: string; verifyKey: string } },
    threshold: credentialPublicKeys.threshold,
  };

  // Construct CredentialDeploymentTransaction in SDK format
  // proofs should remain as IdOwnershipProofs object - serialization will handle conversion to hex
  const unsignedCdiForSDK = {
    ...unsignedCdi,
    credentialPublicKeys: normalizedCredentialPublicKeys,
    policy: cleanPolicy,
    proofs: unsignedCdi.proofs,
    arData: unsignedCdi.arData as Record<string, ChainArData>,
    ...(commitments && {
      commitments: {
        cmmPrf: commitments.cmmPrf || "",
        cmmCredCounter: commitments.cmmCredCounter || "",
        cmmIdCredSecSharingCoeff: commitments.cmmIdCredSecSharingCoeff || [],
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        cmmAttributes: (cmmAttributes || {}) as Record<AttributeKey, string>,
        cmmMaxAccounts: commitments.cmmMaxAccounts || "",
      },
    }),
  };

  return {
    expiry: TransactionExpiry.fromEpochSeconds(serialized.expiry),
    unsignedCdi: unsignedCdiForSDK,
    randomness: serialized.randomness as WebSDKCommitmentsRandomness,
  };
}

/**
 * Credential deployment signing
 *
 * Signs the credential deployment transaction directly on the Ledger device using
 * the account signing key. The device app uses the account signing key path internally
 * (m/44'/919'/idp'/identity'/2'/account_index'/sig_index') to sign the credential
 * deployment digest.
 *
 * Note: The device app doesn't support exporting account signing keys (only PRF keys
 * and ID_CRED_SEC keys can be exported). The browser wallet can derive signing keys
 * because it has access to the seed, but with a hardware wallet, the seed never leaves
 * the device. Both approaches sign the same credential deployment digest, producing
 * compatible Ed25519 signatures.
 *
 * @param signerContext - Signer context for device access (already wrapped by bridge)
 * @param deviceId - Device ID
 * @param path - BIP32 derivation path (used to derive the account signing key path internally)
 * @param transaction - SerializedCredentialDeploymentDetails from IDApp SDK
 * @returns Signature array matching hw-app-concordium format
 */
export async function signCredentialDeployment(
  signerContext: SignerContext<ConcordiumSigner>,
  deviceId: string,
  path: string,
  transaction: SerializedCredentialDeploymentDetails,
): Promise<{ signature: string[] }> {
  const credentialDeployment = deserializeCredentialDeployment(transaction);

  // Always true for onboarding flow - we're always creating new accounts
  // When false, hw-app-concordium sends account address instead of expiry to device
  const isNew = true;

  return signerContext(deviceId, async signer => {
    return signer.signCredentialDeployment(credentialDeployment, path, {
      isNew,
    });
  });
}

/**
 * Check if an account is already onboarded (has credentials deployed)
 *
 * Uses the browser wallet approach: checks credential deployment status by querying
 * account info using the credential ID. This directly verifies credential deployment status.
 *
 * @param currency - The Concordium currency
 * @param credId - Credential ID to check (required)
 * @returns Object with isOnboarded flag and accountAddress if found
 */
export async function isAccountOnboarded(
  currency: CryptoCurrency,
  _publicKey: string,
  credId: string,
): Promise<{ isOnboarded: boolean; accountAddress?: string }> {
  try {
    const accountInfo = await getAccountInfo(currency, credId);

    return {
      isOnboarded: true,
      accountAddress: accountInfo.accountAddress.toString(),
    };
  } catch (_error) {
    // RpcError or any error means credential is not deployed
    return { isOnboarded: false };
  }
}

/**
 * This section contains reimplementations of ID App SDK methods to remove
 * the dependency on @concordium/id-app-sdk while maintaining the same functionality.
 *
 * Source: @concordium/id-app-sdk v0.1.4
 * License: Apache-2.0 (compatible)
 */

function deserializeCredentialDeploymentTransaction(
  serializedCredentialDeploymentTransaction: SerializedCredentialDeploymentDetails,
): WebSDKCredentialDeploymentTransaction {
  const credentialDeploymentTransaction = {} as WebSDKCredentialDeploymentTransaction;
  credentialDeploymentTransaction.unsignedCdi = JSONbig.parse(
    serializedCredentialDeploymentTransaction.unsignedCdiStr,
  );
  credentialDeploymentTransaction.expiry = TransactionExpiry.fromEpochSeconds(
    serializedCredentialDeploymentTransaction.expiry,
  );
  // Cast randomness to web-sdk type - attributesRand is compatible at runtime
  // Record<string, string> is compatible with Record<AttributeKey, string>
  credentialDeploymentTransaction.randomness =
    serializedCredentialDeploymentTransaction.randomness as WebSDKCommitmentsRandomness;
  return credentialDeploymentTransaction;
}

/**
 * Sign a credential deployment transaction
 *
 * Reimplementation of ConcordiumIDAppSDK.signCredentialTransaction
 *
 * @param serializedCredentialDeploymentTransaction - Credential deployment transaction to sign
 * @param signingKey - Signing key to use for the account
 * @returns Signed credential deployment transaction
 */
export async function signCredentialTransaction(
  serializedCredentialDeploymentTransaction: SerializedCredentialDeploymentDetails,
  signingKey: HexString,
): Promise<SignedCredentialDeploymentTransaction> {
  const credentialDeploymentTransaction: WebSDKCredentialDeploymentTransaction =
    deserializeCredentialDeploymentTransaction(serializedCredentialDeploymentTransaction);

  const signature = await webSDKSignCredentialTransaction(
    credentialDeploymentTransaction,
    signingKey,
  );

  // Convert back to our CredentialDeploymentTransaction format (expiry as bigint)
  // Randomness stays as object per updated type - no stringify needed
  return {
    credentialDeploymentTransaction: {
      expiry: credentialDeploymentTransaction.expiry.expiryEpochSeconds,
      unsignedCdiStr: serializedCredentialDeploymentTransaction.unsignedCdiStr,
      randomness:
        credentialDeploymentTransaction.randomness as unknown as import("../types/onboard").CommitmentsRandomness,
    },
    signature,
  };
}

/**
 * Submit a credential deployment transaction to the network
 *
 * Uses wallet-proxy instead of direct gRPC to avoid CORS issues in browser.
 * Serializes the credential deployment transaction with the account signature and submits it
 * as raw bytes via /v0/submitRawTransaction, as per the Concordium documentation:
 * https://docs.concordium.com/en/mainnet/tools/wallet-sdk/wallet-sdk-credential-deployment.html
 *
 * @param credentialDeploymentTransaction - Credential deployment transaction to submit
 * @param signature - Account signature on the credential deployment transaction hash (from device)
 * @param currency - Currency to determine the network
 * @returns Submission ID (can be used to query transaction status)
 */
export async function submitCCDTransaction(
  credentialDeploymentTransaction: CredentialDeploymentTransaction,
  signature: HexString,
  currency: CryptoCurrency,
): Promise<string> {
  // Parse unsignedCdi to extract credential info
  let unsignedCdi: UnsignedCredentialDeploymentInformation;
  try {
    unsignedCdi = JSONbig.parse(credentialDeploymentTransaction.unsignedCdiStr);
  } catch (error) {
    throw new Error(
      `Failed to parse unsignedCdiStr: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // 1. Check transaction expiry
  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  const expiryTime = Number(credentialDeploymentTransaction.expiry);
  const timeUntilExpiry = expiryTime - currentTimeSeconds;
  const isExpiryValid = expiryTime > currentTimeSeconds && timeUntilExpiry < 86400 * 365; // Max 1 year

  if (!isExpiryValid) {
    throw new Error(`Invalid expiry: ${expiryTime} (current: ${currentTimeSeconds})`);
  }

  // 2. Check for duplicate credential
  try {
    const accountInfo = await getAccountInfo(currency, unsignedCdi.credId);
    throw new Error(
      `Credential ${unsignedCdi.credId} already exists at ${accountInfo.accountAddress}`,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("already exists")) {
      throw error;
    }
    // Credential doesn't exist, proceed
  }

  // 3. Validate credential structure
  const credentialPublicKeys = unsignedCdi.credentialPublicKeys;
  const keyIndices =
    credentialPublicKeys && isICredentialPublicKeys(credentialPublicKeys)
      ? Object.keys(credentialPublicKeys.keys || {})
          .map(Number)
          .sort((a, b) => a - b)
      : [0];
  const threshold =
    credentialPublicKeys && isICredentialPublicKeys(credentialPublicKeys)
      ? credentialPublicKeys.threshold || 1
      : 1;
  const firstKeyIndex = keyIndices[0] ?? 0;

  // 4. Validate signature format and mapping
  const signatureLength = signature.length;
  const expectedSignatureLength = 128; // 64 bytes = 128 hex chars for Ed25519
  const isSignatureLengthValid = signatureLength === expectedSignatureLength;
  const isSignatureHex = /^[0-9a-fA-F]+$/.test(signature);

  if (!isSignatureLengthValid) {
    throw new Error(
      `Invalid signature length: ${signatureLength} (expected ${expectedSignatureLength})`,
    );
  }

  if (!isSignatureHex) {
    throw new Error("Signature is not valid hex string");
  }

  // 5. Validate identity provider
  const ipIdentity = unsignedCdi.ipIdentity;

  // Following the Concordium documentation pattern:
  // https://docs.concordium.com/en/mainnet/tools/wallet-sdk/wallet-sdk-credential-deployment.html
  //
  // The documentation shows:
  // 1. Create credential deployment transaction (already done via IDApp)
  // 2. Sign the transaction (already done on device)
  // 3. Send using serializeCredentialDeploymentPayload + sendCredentialDeploymentTransaction
  //
  // Pattern from docs:
  // const payload = serializeCredentialDeploymentPayload([signature], credentialDeployment);
  // const hash = await sendCredentialDeploymentTransaction(payload, expiry);

  // Convert to web SDK format - CredentialDeploymentPayload includes randomness
  // Randomness is now always an object (CommitmentsRandomness) per the updated type
  const webSDKTransaction: WebSDKCredentialDeploymentTransaction =
    deserializeCredentialDeploymentTransaction({
      expiry: Number(credentialDeploymentTransaction.expiry),
      unsignedCdiStr: credentialDeploymentTransaction.unsignedCdiStr,
      randomness: credentialDeploymentTransaction.randomness,
    });

  // Create CredentialDeploymentPayload (CredentialDeploymentDetails + randomness)
  // This matches the type expected by serializeCredentialDeploymentPayload
  // CredentialDeploymentPayload = CredentialDeploymentDetails & { randomness: CommitmentsRandomness }
  const credentialDeploymentPayload = {
    expiry: webSDKTransaction.expiry,
    unsignedCdi: webSDKTransaction.unsignedCdi,
    randomness: webSDKTransaction.randomness,
  };

  // 6. Verify signature mapping
  // The signature must be at signatures[0] to map to KeyIndex(0)
  // This is confirmed by build_signature_map in Rust:
  // signatures[0] → KeyIndex(0), signatures[1] → KeyIndex(1), etc.
  const signatures = [signature];

  if (firstKeyIndex !== 0) {
    throw new Error(
      `Signature mapping mismatch: signature at signatures[0] maps to KeyIndex(0), but actual signing key is at index ${firstKeyIndex}`,
    );
  }

  // Verify signature is a valid hex string before serialization
  if (!/^[0-9a-fA-F]+$/.test(signature)) {
    throw new Error(`Invalid signature format: expected hex string, got ${typeof signature}`);
  }

  // Following the documented pattern: serializeCredentialDeploymentPayload
  // This creates the credential deployment payload (without expiry wrapper)
  const payload = serializeCredentialDeploymentPayload(signatures, credentialDeploymentPayload);

  // Use the SDK's sendCredentialDeploymentTransaction which follows the documented pattern
  // This internally wraps the payload with expiry and sends via gRPC
  try {
    const transactionHash = await sendCredentialDeploymentTransaction(
      currency,
      payload,
      webSDKTransaction.expiry,
    );

    // Return the transaction hash as submission ID (wallet-proxy format)
    return transactionHash.toString();
  } catch (error) {
    // Parse error to provide more context
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Credential rejected") || errorMessage.includes("rejected")) {
      // Log all relevant context for debugging
      // eslint-disable-next-line no-console
      console.error("[submitCCDTransaction] Credential rejected with context:", {
        credId: unsignedCdi.credId,
        ipIdentity: unsignedCdi.ipIdentity,
        expiry: credentialDeploymentTransaction.expiry,
        signatureLength: signature.length,
        keyIndices,
        threshold,
        error: errorMessage,
      });
    }

    throw error;
  }
}

/**
 * Create account creation request message
 *
 * Reimplementation of ConcordiumIDAppSDK.getCreateAccountCreationRequest
 *
 * @param publicKey - Public key to use for the account
 * @param reason - Description of the use of this public key
 * @returns Create account creation request message
 */
export function getCreateAccountCreationRequest(
  publicKey: string,
  reason: string = "The account wallet is requesting and Identity to create an account",
): CreateAccountCreationRequestMessage {
  return {
    publicKey,
    reason,
  };
}
