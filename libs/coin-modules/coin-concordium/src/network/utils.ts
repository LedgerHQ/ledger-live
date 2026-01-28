import { Buffer } from "buffer";
import JSONbig from "json-bigint";
import type {
  CredentialDeploymentTransaction,
  IdOwnershipProofs,
} from "@ledgerhq/hw-app-concordium/lib/types";
import { serializeAccountOwnershipProofs } from "@ledgerhq/hw-app-concordium/lib/serialization";
import { encodeWord32 } from "@ledgerhq/hw-app-concordium/lib/utils";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  SerializedCredentialDeploymentTransaction,
  SubmitCredentialData,
} from "../types/network";

export function getConcordiumNetwork(currency: CryptoCurrency): "Mainnet" | "Testnet" {
  return currency.isTestnetFor ? "Testnet" : "Mainnet";
}

/**
 * Deserializes a credential deployment transaction from Concordium ID App format.
 *
 * The Concordium ID App sends credential deployment transactions as JSON strings
 * via WalletConnect. This function transforms that serialized format into the
 * strongly-typed CredentialDeploymentTransaction structure that hw-app-concordium expects.
 *
 * ## Key Transformations
 *
 * 1. **JSON Parsing**: Uses JSONbig to safely handle large integers without losing precision
 *
 * 2. **Proof Structure**: Extracts ID ownership proofs into a typed IdOwnershipProofs object.
 *    Note: This contains only the ID ownership proofs from the ID App. The account ownership
 *    proofs from the Ledger device will be added later via insertAccountOwnershipProofs().
 *
 * 3. **Expiry Conversion**: Converts the expiry timestamp from string/number to BigInt,
 *    as required by hw-app-concordium for proper serialization.
 *
 * 4. **Data Restructuring**: Maps the ID App's data structure to match the format expected
 *    by the Ledger device signing flow.
 *
 * @param serializedCredentialDeploymentTransaction - Serialized credential from ID App via WalletConnect
 * @returns Typed credential deployment transaction ready for device signing
 */
export function deserializeCredentialDeploymentTransaction(
  serializedCredentialDeploymentTransaction: SerializedCredentialDeploymentTransaction,
): CredentialDeploymentTransaction {
  const unsignedCdi = JSONbig.parse(serializedCredentialDeploymentTransaction.unsignedCdiStr);

  const credentialPublicKeys = {
    keys: unsignedCdi.credentialPublicKeys.keys,
    threshold: unsignedCdi.credentialPublicKeys.threshold,
  };

  const arData = Object.fromEntries(
    Object.entries(unsignedCdi.arData).map(([arIdentity, data]: [string, any]) => [
      arIdentity,
      {
        encIdCredPubShare: data.encIdCredPubShare,
      },
    ]),
  );

  const proofs: IdOwnershipProofs = {
    sig: unsignedCdi.proofs.sig,
    commitments: unsignedCdi.proofs.commitments,
    challenge: unsignedCdi.proofs.challenge,
    proofIdCredPub: unsignedCdi.proofs.proofIdCredPub,
    proofIpSig: unsignedCdi.proofs.proofIpSig,
    proofRegId: unsignedCdi.proofs.proofRegId,
    credCounterLessThanMaxAccounts: unsignedCdi.proofs.credCounterLessThanMaxAccounts,
  };

  return {
    credentialPublicKeys,
    credId: unsignedCdi.credId,
    ipIdentity: unsignedCdi.ipIdentity,
    revocationThreshold: unsignedCdi.revocationThreshold,
    arData,
    policy: {
      validTo: unsignedCdi.policy.validTo,
      createdAt: unsignedCdi.policy.createdAt,
      revealedAttributes: unsignedCdi.policy.revealedAttributes,
    },
    proofs,
    expiry: BigInt(serializedCredentialDeploymentTransaction.expiry),
  };
}

/**
 * Inserts account ownership proofs into ID ownership proofs to build complete CredDeploymentProofs.
 *
 * This function is critical for credential deployment. It takes the ID ownership proofs
 * from the Concordium ID App and the account ownership signature from the Ledger device,
 * then combines them into the complete proof structure required by the Concordium blockchain.
 *
 * ## Why Insertion Order Matters
 * The Concordium protocol defines a specific serialization order for CredDeploymentProofs.
 * The account ownership proofs MUST be inserted at position 7 (between proofRegId and credCounterLessThanMaxAccounts),
 * not appended at the end.
 *
 * Incorrect ordering will cause the blockchain node to reject the credential with the error:
 * "Credential rejected by the node"
 *
 * ## Serialization Order
 * 1. sig (IP signature)
 * 2. commitments
 * 3. challenge
 * 4. proofIdCredPub (u32 count + map entries with u32 keys, sorted by index)
 * 5. proofIpSig (identity provider signature proof)
 * 6. proofRegId (registration ID proof)
 * 7. **proof_acc_sk (AccountOwnershipProof) ← INSERTED HERE**
 * 8. credCounterLessThanMaxAccounts
 *
 * @param idProofs - ID ownership proofs from the Concordium ID App
 * @param accountSignature - Account ownership signature from the Ledger device (hex string, 64 bytes)
 * @returns Complete CredDeploymentProofs as hex string, ready for submission
 */
export function insertAccountOwnershipProofs(
  idProofs: IdOwnershipProofs,
  accountSignature: string,
): string {
  const accountProofBuffer = serializeAccountOwnershipProofs([accountSignature]);

  const proofIdCredPubEntries = Object.entries(idProofs.proofIdCredPub);
  const proofIdCredPubLength = encodeWord32(proofIdCredPubEntries.length);
  const proofIdCredPubData = Buffer.concat(
    proofIdCredPubEntries
      .sort(([indexA], [indexB]) => parseInt(indexA, 10) - parseInt(indexB, 10))
      .map(([index, value]) => {
        const serializedIndex = encodeWord32(parseInt(index, 10));
        const serializedValue = Buffer.from(value, "hex");
        return Buffer.concat([serializedIndex, serializedValue]);
      }),
  );

  const combined = Buffer.concat([
    Buffer.from(idProofs.sig, "hex"),
    Buffer.from(idProofs.commitments, "hex"),
    Buffer.from(idProofs.challenge, "hex"),
    proofIdCredPubLength,
    proofIdCredPubData,
    Buffer.from(idProofs.proofIpSig, "hex"),
    Buffer.from(idProofs.proofRegId, "hex"),
    accountProofBuffer,
    Buffer.from(idProofs.credCounterLessThanMaxAccounts, "hex"),
  ]);

  return combined.toString("hex");
}

/**
 * Builds the credential submission data for wallet-proxy API.
 *
 * This function combines the credential deployment transaction from the ID App
 * with the account ownership signature from the Ledger device to create the
 * complete payload for the /v0/submitCredential endpoint.
 *
 * ## Credential Type
 * The credential type is hardcoded to "normal" because Ledger Live only creates
 * credentials for existing identities. The "initial" type is only used when creating
 * the very first credential for a brand new identity, which is done through the
 * Concordium ID App, not Ledger Live.
 *
 * ## Proof Serialization
 * The proofs field requires careful handling. It must contain the complete
 * CredDeploymentProofs structure:
 *
 * 1. ID ownership proofs (from ID App):
 *    - sig, commitments, challenge, proofIdCredPub, proofIpSig, proofRegId, credCounterLessThanMaxAccounts
 *
 * 2. Account ownership proofs (from Ledger device):
 *    - Must be inserted BETWEEN proofRegId and credCounterLessThanMaxAccounts
 *
 * The insertAccountOwnershipProofs() function handles this critical ordering requirement.
 * Incorrect ordering will result in "Credential rejected by the node" errors.
 *
 * @param credentialDeploymentTransaction - The credential deployment transaction from ID App
 * @param accountSignature - The signature from the Ledger device (hex string, 64 bytes)
 * @returns Complete credential submission data ready for wallet-proxy
 */
export function buildSubmitCredentialData(
  credentialDeploymentTransaction: CredentialDeploymentTransaction,
  accountSignature: string,
): SubmitCredentialData {
  const completeProofs = insertAccountOwnershipProofs(
    credentialDeploymentTransaction.proofs,
    accountSignature,
  );

  return {
    v: 0,
    value: {
      messageExpiry: Number(credentialDeploymentTransaction.expiry),
      credential: {
        type: "normal",
        contents: {
          credentialPublicKeys: credentialDeploymentTransaction.credentialPublicKeys,
          credId: credentialDeploymentTransaction.credId,
          ipIdentity: credentialDeploymentTransaction.ipIdentity,
          revocationThreshold: credentialDeploymentTransaction.revocationThreshold,
          arData: credentialDeploymentTransaction.arData,
          policy: credentialDeploymentTransaction.policy,
          proofs: completeProofs,
        },
      },
    },
  };
}
