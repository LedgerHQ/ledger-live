/**
 * Concordium Testing Utilities for Ed25519 Key Generation
 *
 * Provides utilities to generate proper Ed25519 keypairs for testing Concordium
 * onboarding without requiring physical Ledger devices.
 * The mock signer implements the signing algorithm used by the Concordium app.
 */

import crypto from "node:crypto";
import type {
  Address,
  VerifyAddressResponse,
  Transaction,
  CredentialDeploymentTransaction,
  SigningResult,
} from "@ledgerhq/hw-app-concordium/lib/types";
import type { ConcordiumSigner } from "../types";

export interface ConcordiumTestKeyPair {
  publicKeyHex: string; // Ed25519 public key in hex format (64 chars)
  privateKeyHex: string; // ASN.1 DER encoded private key in hex format
  privateKeyPem: string; // PEM format for signing operations
  sign: (data: string) => string; // Sign transaction data
}

/**
 * Generate fresh Ed25519 keypair for Concordium
 */
export function generateMockKeyPair(): ConcordiumTestKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyBuffer = publicKey.export({ type: "spki", format: "der" });
  const rawPublicKey = publicKeyBuffer.subarray(-32); // Ed25519 public key is 32 bytes
  const publicKeyHex = rawPublicKey.toString("hex");

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
  const privateKeyDer = privateKey.export({ type: "pkcs8", format: "der" });
  const privateKeyHex = privateKeyDer.toString("hex");

  return {
    publicKeyHex, // 64-char hex string (no 0x prefix)
    privateKeyHex, // ASN.1 DER encoded private key in hex format
    privateKeyPem, // PEM format string

    /**
     * Sign transaction data using Ed25519 signature.
     * Accepts UTF-8 strings (e.g., JSON.stringify output) and produces hex signature.
     */
    sign: (data: string): string => {
      const dataBuffer = Buffer.from(data, "utf-8");

      const privateKeyObj = crypto.createPrivateKey({
        key: privateKeyPem,
        format: "pem",
        type: "pkcs8",
      });

      const signature = crypto.sign(null, dataBuffer, privateKeyObj);
      return signature.toString("hex");
    },
  };
}

/**
 * Create a mock signer that implements ConcordiumSigner interface
 */
export function createMockSigner(keyPair: ConcordiumTestKeyPair): ConcordiumSigner {
  return {
    getAddress: async (
      _path: string,
      _display?: boolean,
      _id?: number,
      _cred?: number,
      _idp?: number,
      _isLegacy?: boolean,
    ): Promise<Address> => {
      // Generate a mock address from the public key
      // In real implementation, this would derive the address from the public key using Concordium's address derivation
      const address = `4${keyPair.publicKeyHex.slice(0, 63)}`; // Mock Concordium address format
      return {
        address,
        publicKey: keyPair.publicKeyHex,
      };
    },

    getPublicKey: async (_path: string, _confirm?: boolean): Promise<string> => {
      return keyPair.publicKeyHex;
    },

    signTransaction: async (tx: Transaction, path: string): Promise<SigningResult> => {
      const serializedTx = JSON.stringify({
        transaction: tx,
        path,
      });
      const signature = keyPair.sign(serializedTx);
      return {
        signature,
        serialized: "mock-serialized-" + signature.slice(0, 32),
      };
    },

    signCredentialDeployment: async (
      tx: CredentialDeploymentTransaction,
      path: string,
    ): Promise<string> => {
      // Mock signing - in real implementation, device would serialize proofs as part of hash
      // For testing, we serialize the entire transaction structure
      const serializedTx = JSON.stringify({
        transaction: {
          ...tx,
          // Serialize proofs for consistent hashing in mock
          proofs: JSON.stringify(tx.proofs),
        },
        path,
      });
      return keyPair.sign(serializedTx);
    },

    verifyAddress: async (
      _identityIndex: number,
      _credNumber: number,
      _ipIdentity: number,
      credId?: string,
    ): Promise<VerifyAddressResponse> => {
      // Mock implementation - always returns success
      // If credId is provided, return it as deviceCredId
      if (credId) {
        return {
          status: "success",
          address: `mock-address-${credId.slice(0, 16)}`,
          deviceCredId: credId,
          devicePrfKey: `mock-prfKey-${credId.slice(0, 8)}`,
        };
      }
      return { status: "success" };
    },
  };
}
