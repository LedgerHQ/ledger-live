/**
 * Holds the member key of this instance. No method returns private key bytes, so a secure key
 * storage can implement it with keys that never leave the hardware. The composite schemes of a
 * later protocol (key agreement, decapsulation) add methods here without changing callers.
 */
export interface KeyStore {
  /** The member key of this instance, or null when it has none. */
  current(): Promise<KeyHandle | null>;
  /** Creates a key under `alias`; the private key never leaves the store. */
  generate(alias: string, algorithm: KeyAlgorithm): Promise<GeneratedKey>;
  /** The public key of `handle`, or null when the key is lost. */
  publicKey(handle: KeyHandle): Promise<Uint8Array | null>;
  /** Signs `message` with the private key of `handle`. */
  sign(handle: KeyHandle, message: Uint8Array): Promise<Uint8Array>;
  /** Deletes the key of `handle`. */
  delete(handle: KeyHandle): Promise<void>;
}

/** The signature algorithms member keys use: v1 members sign with secp256k1. */
export type KeyAlgorithm = "ecdsa-secp256k1" | "ecdsa-p256" | "ml-dsa-65";

/** A key held by a key store: callers keep the handle, never the private key. */
export type KeyHandle = Readonly<{ alias: string; algorithm: KeyAlgorithm }>;

/** What `KeyStore.generate` returns. */
export type GeneratedKey = Readonly<{ handle: KeyHandle; publicKey: Uint8Array }>;
