/**
 * Public key utilities for Internet Computer accounts
 */
import { AccountIdentifier } from "@icp-sdk/canisters/ledger/icp";
import { DerEncodedPublicKey } from "@icp-sdk/core/agent";
import { Secp256k1PublicKey } from "@icp-sdk/core/identity/secp256k1";
import { Principal } from "@icp-sdk/core/principal";

/**
 * Validates a hex-encoded public key string
 * @param publicKey - Hex-encoded public key to validate
 * @throws Error if the public key is invalid
 */
export const validatePublicKey = (publicKey: string): void => {
  if (!publicKey || typeof publicKey !== "string") {
    throw new Error("Public key must be a non-empty string");
  }
  // Check if it's a valid hex string
  if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
    throw new Error("Public key must be a valid hex string");
  }
  // Check length (33 bytes compressed = 66 hex chars, 65 bytes uncompressed = 130 hex chars)
  const byteLength = publicKey.length / 2;
  if (byteLength !== 33 && byteLength !== 65) {
    throw new Error(
      `Public key must be 33 bytes (compressed) or 65 bytes (uncompressed), got ${byteLength} bytes`,
    );
  }
};

/**
 * Derives a Principal from a hex-encoded secp256k1 public key
 * @param publicKey - Hex-encoded public key (33 bytes compressed or 65 bytes uncompressed)
 * @returns Principal derived from the public key
 * @throws Error if the public key is invalid
 */
export const derivePrincipalFromPubkey = (publicKey: string): Principal => {
  validatePublicKey(publicKey);
  const pubkeyArray = new Uint8Array(Buffer.from(publicKey, "hex"));
  const pubkey = Secp256k1PublicKey.fromRaw(pubkeyArray);
  return Principal.selfAuthenticating(new Uint8Array(pubkey.toDer()));
};

/**
 * Derives an account address (AccountIdentifier) from a hex-encoded secp256k1 public key
 * @param publicKey - Hex-encoded public key (33 bytes compressed or 65 bytes uncompressed)
 * @returns Hex-encoded account identifier
 * @throws Error if the public key is invalid
 */
export const deriveAddressFromPubkey = (publicKey: string): string => {
  validatePublicKey(publicKey);
  const pubKeyArray = new Uint8Array(Buffer.from(publicKey, "hex"));
  const pubkey = Secp256k1PublicKey.fromRaw(pubKeyArray);
  const principal = Principal.selfAuthenticating(new Uint8Array(pubkey.toDer()));
  const address = AccountIdentifier.fromPrincipal({ principal: principal });

  return address.toHex();
};

/**
 * Converts a hex-encoded secp256k1 public key to DER encoding
 * @param publicKey - Hex-encoded public key (33 bytes compressed or 65 bytes uncompressed)
 * @returns DER-encoded public key
 * @throws Error if the public key is invalid
 */
export const pubkeyToDer = (publicKey: string): DerEncodedPublicKey => {
  validatePublicKey(publicKey);
  const pubKeyArray = new Uint8Array(Buffer.from(publicKey, "hex"));
  const pubkey = Secp256k1PublicKey.fromRaw(pubKeyArray);
  return pubkey.toDer();
};
