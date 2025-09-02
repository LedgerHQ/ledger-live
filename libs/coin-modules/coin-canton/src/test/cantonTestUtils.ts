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
    publicKeyHex,
    "Private key starts with ASN.1 header:",
    privateKeyHex.startsWith("302e020100300506032b6570042204"),
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
