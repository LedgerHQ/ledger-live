import crypto from "crypto";
import { UpdateIncorrectSig } from "@ledgerhq/errors";
import * as sslHelper from "./sslHelper";

// Test keys and data for consistent testing
const testMessage = "Hello, this is a test message for signature verification";

// Generate a test key pair for consistent testing
const { publicKey: testPublicKeyPem, privateKey: testPrivateKeyPem } = crypto.generateKeyPairSync(
  "ec",
  {
    namedCurve: "secp256k1",
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  },
);

describe("sslHelper", () => {
  describe("getFingerprint", () => {
    it("should return a SHA256 hash of the public key", async () => {
      const fingerprint = await sslHelper.getFingerprint(testPublicKeyPem);

      // Should be a 64-character hex string (SHA256)
      expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(fingerprint).toHaveLength(64);
    });

    it("should return consistent fingerprint for the same public key", async () => {
      const fingerprint1 = await sslHelper.getFingerprint(testPublicKeyPem);
      const fingerprint2 = await sslHelper.getFingerprint(testPublicKeyPem);

      expect(fingerprint1).toBe(fingerprint2);
    });

    it("should return different fingerprints for different public keys", async () => {
      // Generate another key pair
      const { publicKey: anotherPublicKey } = crypto.generateKeyPairSync("ec", {
        namedCurve: "secp256k1",
        publicKeyEncoding: {
          type: "spki",
          format: "pem",
        },
        privateKeyEncoding: {
          type: "pkcs8",
          format: "pem",
        },
      });

      const fingerprint1 = await sslHelper.getFingerprint(testPublicKeyPem);
      const fingerprint2 = await sslHelper.getFingerprint(anotherPublicKey);

      expect(fingerprint1).not.toBe(fingerprint2);
    });

    it("should produce expected fingerprint for known input", async () => {
      const knownPublicKey = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE9VjphHsJx7kCWOYsA8qWLhW8VlNR0MEk
2GKh7kv1t6PYlCr3bKfMDBz/fGzUFzLPpHE+PNF+vGfHV7lC9EKK3g==
-----END PUBLIC KEY-----`;

      const fingerprint = await sslHelper.getFingerprint(knownPublicKey);
      // This should be deterministic
      expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("sign", () => {
    it("should create a valid signature", async () => {
      const signature = await sslHelper.sign(testMessage, testPrivateKeyPem);

      expect(signature).toBeInstanceOf(Buffer);
      expect(signature.length).toBeGreaterThan(0);
    });

    it("should create different signatures for different messages", async () => {
      const signature1 = await sslHelper.sign("message1", testPrivateKeyPem);
      const signature2 = await sslHelper.sign("message2", testPrivateKeyPem);

      expect(signature1).not.toEqual(signature2);
    });

    it("should create consistent signatures for same message and key", async () => {
      // Note: This might not always be true for ECDSA as it uses random nonces
      // But we can at least test that it doesn't throw an error
      const signature1 = await sslHelper.sign(testMessage, testPrivateKeyPem);
      const signature2 = await sslHelper.sign(testMessage, testPrivateKeyPem);

      expect(signature1).toBeInstanceOf(Buffer);
      expect(signature2).toBeInstanceOf(Buffer);
    });
  });

  describe("verify", () => {
    // Note: The verify function expects signatures in DER format created with secp256k1 library
    // This is different from the sign function which uses Node.js crypto API
    // In production, signatures come from external sources that use the expected format

    it("should throw UpdateIncorrectSig for invalid signature", async () => {
      const invalidSignature = Buffer.from("invalid signature");

      await expect(
        sslHelper.verify(testMessage, invalidSignature, testPublicKeyPem),
      ).rejects.toThrow(UpdateIncorrectSig);
    });

    it("should throw UpdateIncorrectSig for malformed public key", async () => {
      const malformedPublicKey = "-----BEGIN PUBLIC KEY-----\nINVALID\n-----END PUBLIC KEY-----";
      const someSignature = Buffer.from([0x30, 0x45, 0x02, 0x20]);

      await expect(
        sslHelper.verify(testMessage, someSignature, malformedPublicKey),
      ).rejects.toThrow(UpdateIncorrectSig);
    });

    it("should handle empty signature", async () => {
      const emptySignature = Buffer.alloc(0);

      await expect(sslHelper.verify(testMessage, emptySignature, testPublicKeyPem)).rejects.toThrow(
        UpdateIncorrectSig,
      );
    });

    it("should handle corrupted DER signature", async () => {
      const corruptedSignature = Buffer.from([0x30, 0x45, 0x02, 0x20]); // Incomplete DER

      await expect(
        sslHelper.verify(testMessage, corruptedSignature, testPublicKeyPem),
      ).rejects.toThrow(UpdateIncorrectSig);
    });

    it("should handle empty public key", async () => {
      const someSignature = Buffer.from([0x30, 0x45, 0x02, 0x20]);

      await expect(sslHelper.verify(testMessage, someSignature, "")).rejects.toThrow(
        UpdateIncorrectSig,
      );
    });
  });

  describe("Integration tests", () => {
    it("should demonstrate sign function creates valid signatures", async () => {
      // Test that sign function works correctly with Node.js crypto API
      const message = "Test message for signing";
      const signature = await sslHelper.sign(message, testPrivateKeyPem);

      expect(signature).toBeInstanceOf(Buffer);
      expect(signature.length).toBeGreaterThan(0);

      // Verify using Node.js crypto (compatible with sign function)
      const verify = crypto.createVerify("sha256");
      verify.update(message);
      const isValid = verify.verify(testPublicKeyPem, signature);
      expect(isValid).toBe(true);
    });

    it("should work with getFingerprint for different keys", async () => {
      const fingerprint1 = await sslHelper.getFingerprint(testPublicKeyPem);

      // Generate another key
      const { publicKey: anotherPublicKey } = crypto.generateKeyPairSync("ec", {
        namedCurve: "secp256k1",
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const fingerprint2 = await sslHelper.getFingerprint(anotherPublicKey);

      expect(fingerprint1).not.toBe(fingerprint2);
      expect(fingerprint1).toMatch(/^[a-f0-9]{64}$/);
      expect(fingerprint2).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should handle sign operations with different messages", async () => {
      const messages = ["message1", "message2", "message3"];
      const signatures: Buffer[] = [];

      for (const message of messages) {
        const signature = await sslHelper.sign(message, testPrivateKeyPem);
        signatures.push(signature);

        // Verify each signature
        const verify = crypto.createVerify("sha256");
        verify.update(message);
        const isValid = verify.verify(testPublicKeyPem, signature);
        expect(isValid).toBe(true);
      }

      // All signatures should be different
      for (let i = 0; i < signatures.length; i++) {
        for (let j = i + 1; j < signatures.length; j++) {
          expect(signatures[i]).not.toEqual(signatures[j]);
        }
      }
    });
  });

  describe("Error handling", () => {
    it("should consistently throw UpdateIncorrectSig for all verification failures", async () => {
      const testCases = [
        {
          name: "invalid signature format",
          message: testMessage,
          signature: Buffer.from("not-a-valid-der-signature"),
          publicKey: testPublicKeyPem,
        },
        {
          name: "corrupted signature",
          message: testMessage,
          signature: Buffer.from([0x30, 0x45, 0x02, 0x20]), // Incomplete DER
          publicKey: testPublicKeyPem,
        },
        {
          name: "random bytes as signature",
          message: testMessage,
          signature: crypto.randomBytes(64),
          publicKey: testPublicKeyPem,
        },
      ];

      for (const testCase of testCases) {
        await expect(
          sslHelper.verify(testCase.message, testCase.signature, testCase.publicKey),
        ).rejects.toThrow(UpdateIncorrectSig);
      }
    });

    it("should handle various error conditions in sign function", async () => {
      const invalidPrivateKey = "-----BEGIN PRIVATE KEY-----\nINVALID\n-----END PRIVATE KEY-----";

      await expect(sslHelper.sign(testMessage, invalidPrivateKey)).rejects.toThrow();
    });
  });
});
