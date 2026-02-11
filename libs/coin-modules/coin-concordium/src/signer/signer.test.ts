import { VALID_ADDRESS, PUBLIC_KEY } from "../test/fixtures";
import { createFixtureSigner, createFixtureSignerContext } from "../bridge/bridge.fixture";
import { getAddress } from "./getAddress";
import { getPublicKey } from "./getPublicKey";
import { signCredentialDeployment } from "./signCredentialDeployment";
import ConcordiumSigner from "./index";

describe("signer", () => {
  describe("getAddress", () => {
    const deviceId = "test-device-id";
    const path = "m/1105'/0'/0'/0'/0'/0'";

    it("should return address and publicKey from signer", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const getAddressFn = getAddress(signerContext);

      // WHEN
      const result = await getAddressFn(deviceId, { path, verify: false });

      // THEN
      expect(result).toEqual({
        path,
        address: VALID_ADDRESS,
        publicKey: PUBLIC_KEY,
      });
    });

    it("should call signer.getAddress with correct path", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const getAddressFn = getAddress(signerContext);

      // WHEN
      await getAddressFn(deviceId, { path, verify: false });

      // THEN
      expect(mockSigner.getAddress).toHaveBeenCalledWith(path, false);
    });

    it("should pass display=true when verify=true", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const getAddressFn = getAddress(signerContext);

      // WHEN
      await getAddressFn(deviceId, { path, verify: true });

      // THEN
      expect(mockSigner.getAddress).toHaveBeenCalledWith(path, true);
    });

    it("should pass display=undefined when verify is undefined", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const getAddressFn = getAddress(signerContext);

      // WHEN
      await getAddressFn(deviceId, { path });

      // THEN
      expect(mockSigner.getAddress).toHaveBeenCalledWith(path, undefined);
    });

    it("should propagate signer errors", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner({
        getAddress: jest.fn().mockRejectedValue(new Error("Device disconnected")),
      });
      const signerContext = createFixtureSignerContext(mockSigner);
      const getAddressFn = getAddress(signerContext);

      // WHEN / THEN
      await expect(getAddressFn(deviceId, { path })).rejects.toThrow("Device disconnected");
    });

    it("should handle different derivation paths", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const getAddressFn = getAddress(signerContext);
      const customPath = "m/1105'/0'/1'/2'/3'/4'";

      // WHEN
      const result = await getAddressFn(deviceId, { path: customPath });

      // THEN
      expect(result.path).toBe(customPath);
      expect(mockSigner.getAddress).toHaveBeenCalledWith(customPath, undefined);
    });
  });

  describe("getPublicKey", () => {
    const deviceId = "test-device-id";
    const path = "m/1105'/0'/0'/0'/0'/0'";

    it("should return public key from signer", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);

      // WHEN
      const result = await getPublicKey(signerContext, deviceId, path);

      // THEN
      expect(result).toBe(PUBLIC_KEY);
    });

    it("should call signer.getPublicKey with correct parameters", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);

      // WHEN
      await getPublicKey(signerContext, deviceId, path);

      // THEN
      expect(mockSigner.getPublicKey).toHaveBeenCalledWith(path, false);
    });

    it("should accept lowercase hex", async () => {
      // GIVEN
      const lowerKey = PUBLIC_KEY.toLowerCase();
      const mockSigner = createFixtureSigner({
        getPublicKey: jest.fn().mockResolvedValue(lowerKey),
      });
      const signerContext = createFixtureSignerContext(mockSigner);

      // WHEN
      const result = await getPublicKey(signerContext, deviceId, path);

      // THEN
      expect(result).toBe(lowerKey);
    });

    it("should accept uppercase hex", async () => {
      // GIVEN
      const upperKey = PUBLIC_KEY.toUpperCase();
      const mockSigner = createFixtureSigner({
        getPublicKey: jest.fn().mockResolvedValue(upperKey),
      });
      const signerContext = createFixtureSignerContext(mockSigner);

      // WHEN
      const result = await getPublicKey(signerContext, deviceId, path);

      // THEN
      expect(result).toBe(upperKey);
    });

    it("should propagate signer errors", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner({
        getPublicKey: jest.fn().mockRejectedValue(new Error("User rejected")),
      });
      const signerContext = createFixtureSignerContext(mockSigner);

      // WHEN / THEN
      await expect(getPublicKey(signerContext, deviceId, path)).rejects.toThrow("User rejected");
    });
  });

  describe("signCredentialDeployment", () => {
    const deviceId = "test-device-id";
    const path = "m/1105'/0'/0'/0'/0'/0'";
    // 128 hex chars = 64 bytes, Ed25519 signature
    const mockSignature = "bb".repeat(64);

    /**
     * Creates a mock credential deployment transaction with standard test values.
     * Hex values represent cryptographic data with documented byte lengths.
     */
    const createMockTransaction = () => ({
      credentialPublicKeys: {
        keys: {
          "0": {
            schemeId: "Ed25519" as const,
            // 64 hex chars = 32 bytes, Ed25519 public key
            verifyKey: "aa".repeat(32),
          },
        },
        threshold: 1,
      },
      // 96 hex chars = 48 bytes, credential ID
      credId: "cc".repeat(48),
      ipIdentity: 0,
      revocationThreshold: 2,
      arData: {
        "1": {
          // 192 hex chars = 96 bytes, encrypted identity credential public share
          encIdCredPubShare: "dd".repeat(96),
        },
      },
      policy: {
        validTo: "202612",
        createdAt: "202512",
        revealedAttributes: {},
      },
      proofs: {
        // 128 hex chars = 64 bytes, signature
        sig: "ee".repeat(64),
        // 200 hex chars = 100 bytes, commitments
        commitments: "ff".repeat(100),
        // 64 hex chars = 32 bytes, challenge
        challenge: "00".repeat(32),
        proofIdCredPub: {
          // 100 hex chars = 50 bytes, proof
          "0": "11".repeat(50),
        },
        // 128 hex chars = 64 bytes, IP signature proof
        proofIpSig: "22".repeat(64),
        // 96 hex chars = 48 bytes, registration ID proof
        proofRegId: "33".repeat(48),
        // 200 hex chars = 100 bytes, credential counter proof
        credCounterLessThanMaxAccounts: "44".repeat(100),
      },
      // Unix timestamp ~2023-11-15
      expiry: 1700000000n,
    });

    it("should return signature from signer", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const transaction = createMockTransaction();

      // WHEN
      const result = await signCredentialDeployment(signerContext, deviceId, transaction, path);

      // THEN
      expect(result).toBe(mockSignature);
    });

    it("should call signer.signCredentialDeployment with correct parameters", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const transaction = createMockTransaction();

      // WHEN
      await signCredentialDeployment(signerContext, deviceId, transaction, path);

      // THEN
      expect(mockSigner.signCredentialDeployment).toHaveBeenCalledWith(transaction, path);
    });

    it("should propagate signer errors", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner({
        signCredentialDeployment: jest.fn().mockRejectedValue(new Error("User cancelled")),
      });
      const signerContext = createFixtureSignerContext(mockSigner);
      const transaction = createMockTransaction();

      // WHEN / THEN
      await expect(
        signCredentialDeployment(signerContext, deviceId, transaction, path),
      ).rejects.toThrow("User cancelled");
    });

    it("should handle different derivation paths", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const transaction = createMockTransaction();
      const customPath = "m/1105'/0'/1'/2'/3'/4'";

      // WHEN
      await signCredentialDeployment(signerContext, deviceId, transaction, customPath);

      // THEN
      expect(mockSigner.signCredentialDeployment).toHaveBeenCalledWith(transaction, customPath);
    });

    it("should handle transaction with multiple credential keys", async () => {
      // GIVEN
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const transaction = {
        ...createMockTransaction(),
        credentialPublicKeys: {
          keys: {
            "0": { schemeId: "Ed25519" as const, verifyKey: "aa".repeat(32) },
            "1": { schemeId: "Ed25519" as const, verifyKey: "bb".repeat(32) },
          },
          threshold: 2,
        },
      };

      // WHEN
      const result = await signCredentialDeployment(signerContext, deviceId, transaction, path);

      // THEN
      expect(result).toBe(mockSignature);
      expect(mockSigner.signCredentialDeployment).toHaveBeenCalledWith(transaction, path);
    });
  });

  describe("default export", () => {
    it("should export ConcordiumSigner as default", () => {
      expect(typeof ConcordiumSigner).toBe("function");
    });
  });
});
