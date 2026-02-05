import type {
  CredentialDeploymentTransaction,
  IdOwnershipProofs,
} from "@ledgerhq/hw-app-concordium/lib/types";
import { insertAccountOwnershipProofs } from "@ledgerhq/hw-app-concordium/lib/serialization";
import type { SerializedCredentialDeploymentTransaction } from "../types";
import { createTestCryptoCurrency, createTestCommitmentsRandomness } from "../test/testHelpers";
import {
  getConcordiumNetwork,
  buildSubmitCredentialData,
  deserializeCredentialDeploymentTransaction,
} from "./utils";

describe("network/utils", () => {
  describe("getConcordiumNetwork", () => {
    it("should return Mainnet for mainnet currency", () => {
      const currency = createTestCryptoCurrency({
        isTestnetFor: undefined,
      });

      expect(getConcordiumNetwork(currency)).toBe("Mainnet");
    });

    it("should return Testnet for testnet currency", () => {
      const currency = createTestCryptoCurrency({
        isTestnetFor: "concordium",
      });

      expect(getConcordiumNetwork(currency)).toBe("Testnet");
    });
  });

  describe("deserializeCredentialDeploymentTransaction", () => {
    it("should deserialize minimal credential deployment transaction", () => {
      const serialized: SerializedCredentialDeploymentTransaction = {
        expiry: 1234567890,
        unsignedCdiStr: JSON.stringify({
          credentialPublicKeys: {
            keys: {
              "0": {
                schemeId: "Ed25519",
                verifyKey: "aa".repeat(32),
              },
            },
            threshold: 1,
          },
          credId: "bb".repeat(48),
          ipIdentity: 0,
          revocationThreshold: 2,
          arData: {
            "1": {
              encIdCredPubShare: "cc".repeat(96),
            },
          },
          policy: {
            validTo: "202612",
            createdAt: "202512",
            revealedAttributes: {},
          },
          proofs: {
            sig: "dd".repeat(64),
            commitments: "ee".repeat(100),
            challenge: "ff".repeat(32),
            proofIdCredPub: {
              "0": "11".repeat(50),
            },
            proofIpSig: "22".repeat(64),
            proofRegId: "33".repeat(48),
            credCounterLessThanMaxAccounts: "44".repeat(100),
          },
        }),
        randomness: createTestCommitmentsRandomness(),
      };

      const result = deserializeCredentialDeploymentTransaction(serialized);

      expect(result.credentialPublicKeys).toEqual({
        keys: {
          "0": {
            schemeId: "Ed25519",
            verifyKey: "aa".repeat(32),
          },
        },
        threshold: 1,
      });
      expect(result.credId).toBe("bb".repeat(48));
      expect(result.ipIdentity).toBe(0);
      expect(result.revocationThreshold).toBe(2);
      expect(result.arData).toEqual({
        "1": {
          encIdCredPubShare: "cc".repeat(96),
        },
      });
      expect(result.policy).toEqual({
        validTo: "202612",
        createdAt: "202512",
        revealedAttributes: {},
      });
      expect(result.proofs.sig).toBe("dd".repeat(64));
      expect(result.expiry).toBe(1234567890n);
    });

    it("should handle multiple credential keys", () => {
      const serialized: SerializedCredentialDeploymentTransaction = {
        expiry: 1234567890,
        unsignedCdiStr: JSON.stringify({
          credentialPublicKeys: {
            keys: {
              "0": { schemeId: "Ed25519", verifyKey: "aa".repeat(32) },
              "1": { schemeId: "Ed25519", verifyKey: "bb".repeat(32) },
              "2": { schemeId: "Ed25519", verifyKey: "cc".repeat(32) },
            },
            threshold: 2,
          },
          credId: "dd".repeat(48),
          ipIdentity: 1,
          revocationThreshold: 3,
          arData: {
            "1": { encIdCredPubShare: "ee".repeat(96) },
          },
          policy: {
            validTo: "202612",
            createdAt: "202512",
            revealedAttributes: {},
          },
          proofs: {
            sig: "ff".repeat(64),
            commitments: "00".repeat(100),
            challenge: "11".repeat(32),
            proofIdCredPub: { "0": "22".repeat(50) },
            proofIpSig: "33".repeat(64),
            proofRegId: "44".repeat(48),
            credCounterLessThanMaxAccounts: "55".repeat(100),
          },
        }),
        randomness: createTestCommitmentsRandomness(),
      };

      const result = deserializeCredentialDeploymentTransaction(serialized);

      expect(Object.keys(result.credentialPublicKeys.keys)).toHaveLength(3);
      expect(result.credentialPublicKeys.threshold).toBe(2);
      expect(result.credentialPublicKeys.keys["0"].verifyKey).toBe("aa".repeat(32));
      expect(result.credentialPublicKeys.keys["1"].verifyKey).toBe("bb".repeat(32));
      expect(result.credentialPublicKeys.keys["2"].verifyKey).toBe("cc".repeat(32));
    });

    it("should handle multiple anonymity revokers", () => {
      const serialized: SerializedCredentialDeploymentTransaction = {
        expiry: 1234567890,
        unsignedCdiStr: JSON.stringify({
          credentialPublicKeys: {
            keys: { "0": { schemeId: "Ed25519", verifyKey: "aa".repeat(32) } },
            threshold: 1,
          },
          credId: "bb".repeat(48),
          ipIdentity: 0,
          revocationThreshold: 3,
          arData: {
            "1": { encIdCredPubShare: "cc".repeat(96) },
            "2": { encIdCredPubShare: "dd".repeat(96) },
            "3": { encIdCredPubShare: "ee".repeat(96) },
          },
          policy: {
            validTo: "202612",
            createdAt: "202512",
            revealedAttributes: {},
          },
          proofs: {
            sig: "ff".repeat(64),
            commitments: "00".repeat(100),
            challenge: "11".repeat(32),
            proofIdCredPub: { "0": "22".repeat(50) },
            proofIpSig: "33".repeat(64),
            proofRegId: "44".repeat(48),
            credCounterLessThanMaxAccounts: "55".repeat(100),
          },
        }),
        randomness: createTestCommitmentsRandomness(),
      };

      const result = deserializeCredentialDeploymentTransaction(serialized);

      expect(Object.keys(result.arData)).toHaveLength(3);
      expect(result.arData["1"].encIdCredPubShare).toBe("cc".repeat(96));
      expect(result.arData["2"].encIdCredPubShare).toBe("dd".repeat(96));
      expect(result.arData["3"].encIdCredPubShare).toBe("ee".repeat(96));
    });

    it("should handle revealed attributes", () => {
      const serialized: SerializedCredentialDeploymentTransaction = {
        expiry: 1234567890,
        unsignedCdiStr: JSON.stringify({
          credentialPublicKeys: {
            keys: { "0": { schemeId: "Ed25519", verifyKey: "aa".repeat(32) } },
            threshold: 1,
          },
          credId: "bb".repeat(48),
          ipIdentity: 0,
          revocationThreshold: 2,
          arData: { "1": { encIdCredPubShare: "cc".repeat(96) } },
          policy: {
            validTo: "202612",
            createdAt: "202512",
            revealedAttributes: {
              firstName: "John",
              lastName: "Doe",
              nationality: "US",
            },
          },
          proofs: {
            sig: "dd".repeat(64),
            commitments: "ee".repeat(100),
            challenge: "ff".repeat(32),
            proofIdCredPub: { "0": "00".repeat(50) },
            proofIpSig: "11".repeat(64),
            proofRegId: "22".repeat(48),
            credCounterLessThanMaxAccounts: "33".repeat(100),
          },
        }),
        randomness: createTestCommitmentsRandomness(),
      };

      const result = deserializeCredentialDeploymentTransaction(serialized);

      expect(result.policy.revealedAttributes).toEqual({
        firstName: "John",
        lastName: "Doe",
        nationality: "US",
      });
    });

    it("should convert expiry to BigInt", () => {
      const serialized: SerializedCredentialDeploymentTransaction = {
        expiry: 9007199254740991, // Max safe integer
        unsignedCdiStr: JSON.stringify({
          credentialPublicKeys: {
            keys: { "0": { schemeId: "Ed25519", verifyKey: "aa".repeat(32) } },
            threshold: 1,
          },
          credId: "bb".repeat(48),
          ipIdentity: 0,
          revocationThreshold: 2,
          arData: { "1": { encIdCredPubShare: "cc".repeat(96) } },
          policy: { validTo: "202612", createdAt: "202512", revealedAttributes: {} },
          proofs: {
            sig: "dd".repeat(64),
            commitments: "ee".repeat(100),
            challenge: "ff".repeat(32),
            proofIdCredPub: { "0": "00".repeat(50) },
            proofIpSig: "11".repeat(64),
            proofRegId: "22".repeat(48),
            credCounterLessThanMaxAccounts: "33".repeat(100),
          },
        }),
        randomness: createTestCommitmentsRandomness(),
      };

      const result = deserializeCredentialDeploymentTransaction(serialized);

      expect(result.expiry).toBe(9007199254740991n);
      expect(typeof result.expiry).toBe("bigint");
    });
  });

  describe("insertAccountOwnershipProofs", () => {
    const createMinimalIdProofs = (): IdOwnershipProofs => ({
      sig: "aa".repeat(64),
      commitments: "bb".repeat(100),
      challenge: "cc".repeat(32),
      proofIdCredPub: {
        "0": "dd".repeat(50),
      },
      proofIpSig: "ee".repeat(64),
      proofRegId: "ff".repeat(48),
      credCounterLessThanMaxAccounts: "00".repeat(100),
    });

    it("should insert account ownership proofs in correct order", () => {
      const idProofs = createMinimalIdProofs();
      const accountSignature = "11".repeat(64);

      const result = insertAccountOwnershipProofs(idProofs, accountSignature);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      // Result should be hex string
      expect(result).toMatch(/^[0-9a-f]+$/);

      // Verify the structure by parsing back
      const buffer = Buffer.from(result, "hex");
      expect(buffer.length).toBeGreaterThan(0);

      // Verify it starts with sig (first 64 bytes = 128 hex chars)
      const sigPart = result.substring(0, 128);
      expect(sigPart).toBe(idProofs.sig);
    });

    it("should handle single proofIdCredPub entry", () => {
      const idProofs: IdOwnershipProofs = {
        sig: "aa".repeat(64),
        commitments: "bb".repeat(100),
        challenge: "cc".repeat(32),
        proofIdCredPub: {
          "0": "dd".repeat(50),
        },
        proofIpSig: "ee".repeat(64),
        proofRegId: "ff".repeat(48),
        credCounterLessThanMaxAccounts: "00".repeat(100),
      };
      const accountSignature = "11".repeat(64);

      const result = insertAccountOwnershipProofs(idProofs, accountSignature);

      expect(result).toMatch(/^[0-9a-f]+$/);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle multiple proofIdCredPub entries with sorting", () => {
      const idProofs: IdOwnershipProofs = {
        sig: "aa".repeat(64),
        commitments: "bb".repeat(100),
        challenge: "cc".repeat(32),
        proofIdCredPub: {
          "2": "dd".repeat(50),
          "0": "ee".repeat(50),
          "1": "ff".repeat(50),
        },
        proofIpSig: "00".repeat(64),
        proofRegId: "11".repeat(48),
        credCounterLessThanMaxAccounts: "22".repeat(100),
      };
      const accountSignature = "33".repeat(64);

      const result = insertAccountOwnershipProofs(idProofs, accountSignature);

      expect(result).toMatch(/^[0-9a-f]+$/);
      expect(result.length).toBeGreaterThan(0);
      // Should not throw, meaning sorting worked correctly
    });

    it("should preserve all proof components", () => {
      const idProofs = createMinimalIdProofs();
      const accountSignature = "99".repeat(64);

      const result = insertAccountOwnershipProofs(idProofs, accountSignature);
      const buffer = Buffer.from(result, "hex");

      // Verify sig is at the beginning
      const sigBuffer = buffer.subarray(0, 64);
      expect(sigBuffer.toString("hex")).toBe(idProofs.sig);

      // Verify credCounterLessThanMaxAccounts is at the end
      const credCounterBuffer = buffer.subarray(buffer.length - 100);
      expect(credCounterBuffer.toString("hex")).toBe(idProofs.credCounterLessThanMaxAccounts);
    });
  });

  describe("buildSubmitCredentialData", () => {
    const createMinimalCredential = (): CredentialDeploymentTransaction => ({
      credentialPublicKeys: {
        keys: {
          "0": {
            schemeId: "Ed25519",
            verifyKey: "aa".repeat(32),
          },
        },
        threshold: 1,
      },
      credId: "bb".repeat(48),
      ipIdentity: 0,
      revocationThreshold: 2,
      arData: {
        "1": {
          encIdCredPubShare: "cc".repeat(96),
        },
      },
      policy: {
        validTo: "202612",
        createdAt: "202512",
        revealedAttributes: {},
      },
      proofs: {
        sig: "dd".repeat(64),
        commitments: "ee".repeat(100),
        challenge: "ff".repeat(32),
        proofIdCredPub: {
          "0": "00".repeat(50),
        },
        proofIpSig: "11".repeat(64),
        proofRegId: "22".repeat(48),
        credCounterLessThanMaxAccounts: "33".repeat(100),
      },
      expiry: 1234567890n,
    });

    it("should build submit credential data with correct structure", () => {
      const credential = createMinimalCredential();
      const accountSignature = "44".repeat(64);

      const result = buildSubmitCredentialData(credential, accountSignature);

      expect(result.v).toBe(0);
      expect(result.value.messageExpiry).toBe(1234567890);
      expect(result.value.credential.type).toBe("normal");
      expect(result.value.credential.contents.credId).toBe("bb".repeat(48));
      expect(result.value.credential.contents.ipIdentity).toBe(0);
      expect(result.value.credential.contents.revocationThreshold).toBe(2);
      expect(typeof result.value.credential.contents.proofs).toBe("string");
    });

    it("should convert expiry from BigInt to Number", () => {
      const credential = createMinimalCredential();
      credential.expiry = 9007199254740991n;
      const accountSignature = "55".repeat(64);

      const result = buildSubmitCredentialData(credential, accountSignature);

      expect(result.value.messageExpiry).toBe(9007199254740991);
      expect(typeof result.value.messageExpiry).toBe("number");
    });

    it("should set credential type to normal", () => {
      const credential = createMinimalCredential();
      const accountSignature = "66".repeat(64);

      const result = buildSubmitCredentialData(credential, accountSignature);

      expect(result.value.credential.type).toBe("normal");
    });

    it("should include all credential fields", () => {
      const credential = createMinimalCredential();
      const accountSignature = "77".repeat(64);

      const result = buildSubmitCredentialData(credential, accountSignature);
      const contents = result.value.credential.contents;

      expect(contents.credentialPublicKeys).toEqual(credential.credentialPublicKeys);
      expect(contents.credId).toBe(credential.credId);
      expect(contents.ipIdentity).toBe(credential.ipIdentity);
      expect(contents.revocationThreshold).toBe(credential.revocationThreshold);
      expect(contents.arData).toEqual(credential.arData);
      expect(contents.policy).toEqual(credential.policy);
      expect(typeof contents.proofs).toBe("string");
    });

    it("should handle credentials with multiple keys and ARs", () => {
      const credential: CredentialDeploymentTransaction = {
        credentialPublicKeys: {
          keys: {
            "0": { schemeId: "Ed25519", verifyKey: "aa".repeat(32) },
            "1": { schemeId: "Ed25519", verifyKey: "bb".repeat(32) },
          },
          threshold: 2,
        },
        credId: "cc".repeat(48),
        ipIdentity: 1,
        revocationThreshold: 3,
        arData: {
          "1": { encIdCredPubShare: "dd".repeat(96) },
          "2": { encIdCredPubShare: "ee".repeat(96) },
          "3": { encIdCredPubShare: "ff".repeat(96) },
        },
        policy: {
          validTo: "202612",
          createdAt: "202512",
          revealedAttributes: { firstName: "John" },
        },
        proofs: {
          sig: "00".repeat(64),
          commitments: "11".repeat(100),
          challenge: "22".repeat(32),
          proofIdCredPub: {
            "0": "33".repeat(50),
            "1": "44".repeat(50),
          },
          proofIpSig: "55".repeat(64),
          proofRegId: "66".repeat(48),
          credCounterLessThanMaxAccounts: "77".repeat(100),
        },
        expiry: 1234567890n,
      };
      const accountSignature = "88".repeat(64);

      const result = buildSubmitCredentialData(credential, accountSignature);

      expect(result.value.credential.contents.credentialPublicKeys.threshold).toBe(2);
      expect(Object.keys(result.value.credential.contents.credentialPublicKeys.keys)).toHaveLength(
        2,
      );
      expect(Object.keys(result.value.credential.contents.arData)).toHaveLength(3);
      expect(result.value.credential.contents.policy.revealedAttributes).toEqual({
        firstName: "John",
      });
    });
  });
});
