import type {
  AttributeKey,
  ChainArData,
  CommitmentsRandomness as WebSDKCommitmentsRandomness,
  CredentialDeploymentTransaction,
  CredentialPublicKeys,
  HexString,
  Policy,
} from "@ledgerhq/concordium-sdk-adapter";
import {
  serializeCredentialDeploymentPayload,
  TransactionExpiry,
} from "@ledgerhq/concordium-sdk-adapter";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  SerializedCredentialDeploymentTransaction,
  UnsignedCredentialDeploymentInformation,
} from "../types/onboard";
import { sendCredentialDeploymentTransaction } from "./grpcClient";

function isICredentialPublicKeys(value: unknown): value is CredentialPublicKeys {
  if (typeof value !== "object" || value === null) return false;
  if (!("keys" in value) || !("threshold" in value)) return false;

  return (
    typeof value.threshold === "number" && typeof value.keys === "object" && value.keys !== null
  );
}

function isICredentialPolicy(value: unknown): value is Policy {
  if (typeof value !== "object" || value === null) return false;
  if (!("validTo" in value) || !("createdAt" in value) || !("revealedAttributes" in value)) {
    return false;
  }

  return (
    typeof value.validTo === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.revealedAttributes === "object" &&
    value.revealedAttributes !== null
  );
}

function isChainArData(value: unknown): value is ChainArData {
  if (typeof value !== "object" || value === null) return false;
  if (!("encIdCredPubShare" in value)) return false;

  return typeof value.encIdCredPubShare === "string";
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

function isExpiryValid(expiry: TransactionExpiry.Type): boolean {
  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  const maxExpirySeconds = 86400 * 365; // Max 1 year
  // Convert TransactionExpiry to number for comparison (epoch seconds fit in Number range)
  const expirySeconds = Number(expiry);

  return (
    expirySeconds > currentTimeSeconds && expirySeconds - currentTimeSeconds < maxExpirySeconds
  );
}

/**
 * Deserialize credential deployment transaction from IDApp SDK format.
 */
export function deserializeCredentialDeploymentTransaction(
  serializedCredentialDeploymentTransaction: SerializedCredentialDeploymentTransaction,
): CredentialDeploymentTransaction {
  let unsignedCdi: UnsignedCredentialDeploymentInformation;

  try {
    unsignedCdi = JSON.parse(serializedCredentialDeploymentTransaction.unsignedCdiStr);
  } catch (error) {
    throw new Error(
      `Failed to parse unsignedCdiStr: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!unsignedCdi || typeof unsignedCdi !== "object") {
    throw new Error("Invalid unsignedCdi structure: parsed value is not an object");
  }

  // Validate and extract typed properties
  if (!isICredentialPublicKeys(unsignedCdi.credentialPublicKeys)) {
    throw new Error("Invalid credentialPublicKeys structure");
  }
  const credentialPublicKeys = unsignedCdi.credentialPublicKeys;

  if (!isICredentialPolicy(unsignedCdi.policy)) {
    throw new Error("Invalid policy structure");
  }
  const policy = unsignedCdi.policy;

  if (!isRecordOfChainArData(unsignedCdi.arData)) {
    throw new Error("Invalid arData structure");
  }
  const arData = unsignedCdi.arData;

  if (typeof unsignedCdi.proofs !== "object" || unsignedCdi.proofs === null) {
    throw new Error(
      `Invalid proofs structure: expected object with IdOwnershipProofs format, got ${typeof unsignedCdi.proofs}`,
    );
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

  // Ensure policy.revealedAttributes is a proper object (not null/undefined)
  const revealedAttributes =
    policy.revealedAttributes && typeof policy.revealedAttributes === "object"
      ? policy.revealedAttributes
      : {};

  // Create a clean policy object with guaranteed structure
  const cleanPolicy: Policy = {
    validTo: policy.validTo || "",
    createdAt: policy.createdAt || "",
    revealedAttributes: revealedAttributes,
  };

  // Ensure credentialPublicKeys.keys uses numeric keys (hw-app-concordium expects number keys)
  const normalizedCredentialPublicKeys: CredentialPublicKeys = {
    keys: Object.fromEntries(
      Object.entries(credentialPublicKeys.keys || {}).map(([key, value]) => [
        parseInt(key, 10),
        value,
      ]),
    ),
    threshold: credentialPublicKeys.threshold,
  };

  const result: CredentialDeploymentTransaction = {
    expiry: TransactionExpiry.fromEpochSeconds(serializedCredentialDeploymentTransaction.expiry),
    unsignedCdi: {
      ...unsignedCdi,
      credentialPublicKeys: normalizedCredentialPublicKeys,
      policy: cleanPolicy,
      arData: arData,
      ...(commitments && {
        commitments: {
          cmmPrf: commitments.cmmPrf || "",
          cmmCredCounter: commitments.cmmCredCounter || "",
          cmmIdCredSecSharingCoeff: commitments.cmmIdCredSecSharingCoeff || [],
          cmmAttributes: cmmAttributes || {},
          cmmMaxAccounts: commitments.cmmMaxAccounts || "",
        },
      }),
    },
    // Type cast needed: Record<string, string> → Record<AttributeKey, string>
    // Structurally identical at runtime, AttributeKey is just a string literal union
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    randomness: serializedCredentialDeploymentTransaction.randomness as WebSDKCommitmentsRandomness,
  };

  return result;
}

/**
 * Submit a credential deployment transaction to the network
 */
export async function submitCredentialDeploymentTransaction(
  credentialDeploymentTransaction: CredentialDeploymentTransaction,
  signature: HexString,
  currency: CryptoCurrency,
): Promise<string> {
  const { expiry, unsignedCdi } = credentialDeploymentTransaction;

  if (!isExpiryValid(expiry)) {
    throw new Error("Invalid expiry in credential deployment transaction");
  }

  const credentialPublicKeys = unsignedCdi.credentialPublicKeys;
  const keyIndices =
    credentialPublicKeys && isICredentialPublicKeys(credentialPublicKeys)
      ? Object.keys(credentialPublicKeys.keys || {})
          .map(Number)
          .sort((a, b) => a - b)
      : [0];

  const firstKeyIndex = keyIndices[0] ?? 0;
  if (firstKeyIndex !== 0) {
    throw new Error(
      `Signature mapping mismatch: signature at signatures[0] maps to KeyIndex(0), but actual signing key is at index ${firstKeyIndex}`,
    );
  }

  if (signature.length !== 128) {
    throw new Error("Signature has invalid length");
  }

  if (!/^[0-9a-fA-F]+$/.test(signature)) {
    throw new Error("Signature is not valid hex string");
  }

  const payload = serializeCredentialDeploymentPayload(
    [signature],
    credentialDeploymentTransaction,
  );

  const transactionHash = await sendCredentialDeploymentTransaction(currency, payload, expiry);

  // Return the transaction hash as submission ID (wallet-proxy format)
  return transactionHash.toString();
}
