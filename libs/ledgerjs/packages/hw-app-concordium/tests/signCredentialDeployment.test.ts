import {
  CredentialDeploymentTransaction,
  TransactionExpiry,
} from "@ledgerhq/concordium-sdk-adapter";
import { serializeCredentialDeployment } from "../src/serialization";
import testData from "./signCredentialDeployment.json";

describe("serializeCredentialDeployment", () => {
  it("should serialize credential deployment transaction from test fixture", () => {
    // Test fixture contains old ICredentialDeploymentTransaction format with proofs as hex string
    // Convert to CredentialDeploymentTransaction format (proofs as object)
    const oldFormat = JSON.parse(testData.transaction);

    // For testing, create a mock IdOwnershipProofs object
    // In real usage, proofs would already be an object from the SDK
    const mockProofs = {
      sig: oldFormat.proofs.substring(0, 128), // First 64 bytes (128 hex chars) as sig
      commitments: oldFormat.proofs.substring(128, 256), // Next 64 bytes
      challenge: oldFormat.proofs.substring(256, 384), // Next 64 bytes
      proofIdCredPub: {},
      proofIpSig: oldFormat.proofs.substring(384, 512),
      proofRegId: oldFormat.proofs.substring(512, 640),
      credCounterLessThanMaxAccounts: oldFormat.proofs.substring(640, 768),
    };

    const transaction: CredentialDeploymentTransaction = {
      expiry: TransactionExpiry.fromEpochSeconds(
        Number(testData.signingParams.expiry || Date.now() / 1000),
      ),
      unsignedCdi: {
        credId: oldFormat.credId,
        ipIdentity: oldFormat.ipIdentity,
        revocationThreshold: oldFormat.revocationThreshold,
        credentialPublicKeys: oldFormat.credentialPublicKeys,
        policy: oldFormat.policy,
        arData: oldFormat.arData,
        proofs: mockProofs,
        commitments: oldFormat.commitments,
      },
      randomness: {} as any, // Test data doesn't include randomness
    };
    const path = testData.signingParams.path;

    // This should not throw an error
    const result = serializeCredentialDeployment(transaction, path, {
      isNew: testData.signingParams.isNew,
    });

    // Verify the result structure
    expect(result).toBeDefined();
    expect(result.payloadDerivationPath).toBeDefined();
    expect(result.numberOfVerificationKeys).toBeDefined();
    expect(result.keyIndexAndSchemeAndVerificationKey).toBeDefined();
    expect(result.thresholdAndRegIdAndIPIdentity).toBeDefined();
    expect(result.encIdCredPubShareAndKey).toBeDefined();
    expect(result.validToAndCreatedAtAndAttributesLength).toBeDefined();
    expect(result.attributesLength).toBeDefined();
    expect(result.tag).toBeDefined();
    expect(result.valueLength).toBeDefined();
    expect(result.value).toBeDefined();
    expect(result.proofLength).toBeDefined();
    expect(result.proofs).toBeDefined();

    // Verify specific values from the test fixture
    expect(result.numberOfVerificationKeys.readUInt8(0)).toBe(
      testData.transactionSummary.credentialPublicKeysCount,
    );
    expect(result.attributesLength.readUInt16BE(0)).toBe(
      testData.transactionSummary.revealedAttributesCount,
    );
    expect(result.proofs.length).toBe(testData.transactionSummary.proofsLength);
  });
});
