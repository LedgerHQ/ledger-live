/**
 * Canton Testing Utilities for Ed25519 Key Generation
 *
 * Provides utilities to generate proper Ed25519 keypairs for testing Canton
 * onboarding without requiring physical Ledger devices.
 */

import crypto from "crypto";

export interface CantonTestKeyPair {
  publicKeyHex: string; // Ready for Canton Gateway API
  privateKeyHex: string; // ASN.1 DER encoded private key in hex format
  privateKeyPem: string; // PEM format for signing operations
  fingerprint: string; // Canton public key fingerprint
  sign: (hashHex: string) => string; // Sign transaction hash
}

/**
 * Generate fresh Ed25519 keypair
 */
export function generateMockKeyPair(): CantonTestKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyBuffer = publicKey.export({ type: "spki", format: "der" });
  const rawPublicKey = publicKeyBuffer.slice(-32);
  const publicKeyHex = rawPublicKey.toString("hex");

  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
  const privateKeyDer = privateKey.export({ type: "pkcs8", format: "der" });
  const privateKeyHex = privateKeyDer.toString("hex");

  const multihashPrefix = "1220";
  const fingerprint = `${multihashPrefix}${publicKeyHex}`;

  // eslint-disable-next-line no-console
  console.log(
    "[generateMockKeyPair] Generated Ed25519 keypair:",
    "publicKeyHex",
    publicKeyHex, // 64-char hex string (no 0x prefix)
    "privateKeyHex",
    privateKeyHex, // ASN.1 DER encoded private key in hex format
    "privateKeyPem",
    privateKeyPem, // PEM format string
    "fingerprint",
    fingerprint, // Canton format: multihash prefix + public key hex
  );

  return {
    publicKeyHex, // 64-char hex string (no 0x prefix)
    privateKeyHex, // ASN.1 DER encoded private key in hex format
    privateKeyPem, // PEM format string
    fingerprint, // Canton format: multihash prefix + public key hex

    /**
     * Sign a transaction hash using proper Ed25519 signature
     */
    sign: (hashHex: string): string => {
      const hashBuffer = Buffer.from(hashHex, "hex");
      const privateKeyObj = crypto.createPrivateKey({
        key: privateKeyPem,
        format: "pem",
        type: "pkcs8",
      });

      const signature = crypto.sign(null, hashBuffer, privateKeyObj);
      return signature.toString("hex");
    },
  };
}

/**
 * Verify Ed25519 signature against public key and message hash
 */
export function verifySignature(
  publicKeyHex: string,
  signatureHex: string,
  messageHashHex: string,
): { isValid: boolean; error?: string; details: any } {
  try {
    // Clean inputs - remove 0x prefixes if present
    const cleanPublicKey = publicKeyHex.startsWith("0x") ? publicKeyHex.slice(2) : publicKeyHex;
    const cleanSignature = signatureHex.startsWith("0x") ? signatureHex.slice(2) : signatureHex;
    const cleanMessageHash = messageHashHex.startsWith("0x")
      ? messageHashHex.slice(2)
      : messageHashHex;

    const details: any = {
      publicKeyLength: cleanPublicKey.length,
      signatureLength: cleanSignature.length,
      messageHashLength: cleanMessageHash.length,
      publicKeyBytes: cleanPublicKey.length / 2,
      signatureBytes: cleanSignature.length / 2,
      messageHashBytes: cleanMessageHash.length / 2,
    };

    // Validate input lengths
    if (cleanPublicKey.length !== 64) {
      return {
        isValid: false,
        error: `Invalid public key length: expected 64 hex chars (32 bytes), got ${cleanPublicKey.length}`,
        details,
      };
    }

    // Ed25519 signatures should be 64 bytes, but we might receive 65 bytes with recovery ID
    let processedSignature = cleanSignature;
    if (cleanSignature.length === 130) {
      // 65 bytes - try different approaches to get 64-byte signature
      console.log(
        `[verifySignature] Signature is 65 bytes, trying to extract 64-byte Ed25519 signature`,
      );

      // Try removing last 2 hex chars (1 byte)
      const sigNoLast = cleanSignature.slice(0, -2);
      console.log(
        `[verifySignature] Option 1 - Remove last byte: ${sigNoLast} (${sigNoLast.length / 2} bytes)`,
      );

      // Try removing first 2 hex chars (1 byte)
      const sigNoFirst = cleanSignature.slice(2);
      console.log(
        `[verifySignature] Option 2 - Remove first byte: ${sigNoFirst} (${sigNoFirst.length / 2} bytes)`,
      );

      // Try removing first and last hex chars (as per user's request)
      const sigStripBoth = cleanSignature.slice(2, -2);
      console.log(
        `[verifySignature] Option 3 - Remove first and last byte: ${sigStripBoth} (${sigStripBoth.length / 2} bytes)`,
      );

      // Default to removing last byte (most common for recovery ID)
      processedSignature = sigNoLast;
      details.originalSignatureLength = cleanSignature.length;
      details.processedSignatureLength = processedSignature.length;
    } else if (cleanSignature.length !== 128) {
      return {
        isValid: false,
        error: `Invalid signature length: expected 128 hex chars (64 bytes) or 130 hex chars (65 bytes), got ${cleanSignature.length}`,
        details,
      };
    }

    // Convert hex to buffers
    const publicKeyBuffer = Buffer.from(cleanPublicKey, "hex");
    const signatureBuffer = Buffer.from(processedSignature, "hex");
    const messageBuffer = Buffer.from(cleanMessageHash, "hex");

    // Create public key object for verification
    // Ed25519 public keys need to be wrapped in SPKI format for Node.js crypto
    const spkiHeader = Buffer.from([
      0x30,
      0x2a, // SEQUENCE, length 42
      0x30,
      0x05, // SEQUENCE, length 5
      0x06,
      0x03,
      0x2b,
      0x65,
      0x70, // OID for Ed25519
      0x03,
      0x21,
      0x00, // BIT STRING, length 33, no unused bits
    ]);
    const spkiPublicKey = Buffer.concat([spkiHeader, publicKeyBuffer]);

    const publicKeyObj = crypto.createPublicKey({
      key: spkiPublicKey,
      format: "der",
      type: "spki",
    });

    // Verify signature
    const isValid = crypto.verify(null, messageBuffer, publicKeyObj, signatureBuffer);

    return {
      isValid,
      details: {
        ...details,
        processedSignatureLength: processedSignature.length,
        verificationMethod: "Node.js crypto.verify with Ed25519",
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Verification failed: ${error instanceof Error ? error.message : String(error)}`,
      details: { error: String(error) },
    };
  }
}

export function createMockSigner(keyPair: CantonTestKeyPair) {
  return {
    getAddress: async (derivationPath: string) => ({
      address: `canton_test_${keyPair.fingerprint.slice(-8)}`,
      publicKey: keyPair.publicKeyHex,
    }),

    signTransaction: async (derivationPath: string, hashToSign: string) => {
      const cleanHash = hashToSign.startsWith("0x") ? hashToSign.slice(2) : hashToSign;
      return keyPair.sign(cleanHash);
    },
  };
}
