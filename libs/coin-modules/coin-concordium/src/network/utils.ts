import type {
  CredentialDeploymentTransaction,
  IdOwnershipProofs,
} from "@ledgerhq/hw-app-concordium/lib/types";
import { insertAccountOwnershipProofs } from "@ledgerhq/hw-app-concordium/lib/serialization";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { SubmitCredentialData, SerializedCredentialDeploymentTransaction } from "../types";

export function getConcordiumNetwork(currency: CryptoCurrency): "Mainnet" | "Testnet" {
  return currency.isTestnetFor ? "Testnet" : "Mainnet";
}

/**
 * Structure of parsed unsignedCdi from ID App
 */
interface ParsedUnsignedCdi {
  credentialPublicKeys: {
    keys: Record<string, { schemeId: string; verifyKey: string }>;
    threshold: number;
  };
  arData: Record<
    string,
    {
      encIdCredPubShare: string;
    }
  >;
  policy: {
    validTo: string;
    createdAt: string;
    revealedAttributes: Record<string, string>;
  };
  ipIdentity: number;
  revocationThreshold: number;
  credId: string;
  proofDlog: string;
  proofIdCredPub: string[];
  sigTheta: string;
  proofs: {
    sig: string;
    commitments: string;
    challenge: string;
    proofIdCredPub: Record<string, string>;
    proofIpSig: string;
    proofRegId: string;
    credCounterLessThanMaxAccounts: string;
  };
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
 * 1. **JSON Parsing**: Parses the unsignedCdiStr which contains only strings and small integers
 *    (all numeric fields are well within JavaScript's MAX_SAFE_INTEGER)
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
  const unsignedCdi = JSON.parse(
    serializedCredentialDeploymentTransaction.unsignedCdiStr,
  ) as ParsedUnsignedCdi;

  const credentialPublicKeys = {
    keys: unsignedCdi.credentialPublicKeys.keys,
    threshold: unsignedCdi.credentialPublicKeys.threshold,
  };

  const arData = Object.fromEntries(
    Object.entries(unsignedCdi.arData).map(([arIdentity, data]) => [
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
