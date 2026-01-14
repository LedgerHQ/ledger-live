/**
 * Concordium Testing Utilities for Ed25519 Key Generation
 *
 * Provides utilities to generate proper Ed25519 keypairs for testing Concordium
 * onboarding without requiring physical Ledger devices.
 * The mock signer implements the signing algorithm used by the Concordium app.
 */

import crypto from "crypto";
import type { CredentialDeploymentTransaction } from "@ledgerhq/concordium-sdk-adapter";
import type { AccountTransactionWithEnergy } from "@ledgerhq/hw-app-concordium/lib/serialization";
import type { ConcordiumAddress, ConcordiumSigner, ConcordiumSignature } from "../types/signer";

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
     * Sign transaction data using Ed25519 signature
     */
    sign: (data: string): string => {
      // Clean input - remove 0x prefix if present
      const cleanData = data.startsWith("0x") ? data.slice(2) : data;
      const dataBuffer = Buffer.from(cleanData, "hex");

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
    getAddress: async (derivationPath: string, display?: boolean): Promise<ConcordiumAddress> => {
      // Generate a mock address from the public key
      // In real implementation, this would derive the address from the public key using Concordium's address derivation
      const address = `4${keyPair.publicKeyHex.slice(0, 63)}`; // Mock Concordium address format
      return {
        address,
        publicKey: keyPair.publicKeyHex,
        path: derivationPath,
      };
    },

    signTransaction: async (
      derivationPath: string,
      rawTx: string,
    ): Promise<ConcordiumSignature> => {
      // Sign the raw transaction data
      const signature = keyPair.sign(rawTx);
      return signature;
    },

    signTransfer: async (txn: AccountTransactionWithEnergy, path: string): Promise<string> => {
      const serializedTx = JSON.stringify({
        transaction: txn,
        path,
      });
      return keyPair.sign(serializedTx);
    },

    signCredentialDeployment: async (
      payload: CredentialDeploymentTransaction,
      path: string,
      _metadata?: { isNew?: boolean; address?: string },
    ): Promise<{ signature: string[] }> => {
      const serializedTx = JSON.stringify({
        transaction: payload,
        path,
      });
      const signatureHex = keyPair.sign(serializedTx);
      return {
        signature: [signatureHex],
      };
    },

    verifyAddress: async (
      _isLegacy: boolean,
      _identityIndex: number,
      _credNumber: number,
      _ipIdentity?: number,
      credId?: string,
    ): Promise<{
      status: string;
      address?: string;
      deviceCredId?: string;
      devicePrfKey?: string;
    }> => {
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
