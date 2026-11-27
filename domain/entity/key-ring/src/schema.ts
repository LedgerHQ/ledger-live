import { z } from "zod";

// Field names are the persisted storage format: renaming one would drop every user's Ledger Sync.

/**
 * The key tree this instance joined, as Ledger Sync v1 persists it. Holds the Ledger Sync key:
 * only `@features/platform-key-ring` reads it, features use the semantic selectors of the slice.
 */
export const KeyRingTreeRecordSchema = z.object({
  /** Id of the key tree. Public: `selectKeyRingTreeId` exposes it. */
  rootId: z.string(),
  /** The Ledger Sync key the stream data is encrypted with. Secret. */
  walletSyncEncryptionKey: z.string(),
  /** Derivation path of the stream this instance uses in the key tree. */
  applicationPath: z.string(),
});

/**
 * The key pair of this instance, as Ledger Sync v1 persists it: a compressed public key and its
 * private key, both lowercase hex. The trust package generates it; the private key is secret.
 */
export const KeyRingMemberKeyRecordSchema = z.strictObject({
  /** Compressed public key, 33 bytes as 66 hex characters. */
  pubkey: z.hex().length(66).lowercase(),
  /** Private key, 32 bytes as 64 hex characters. Secret. */
  privatekey: z.hex().length(64).lowercase(),
});

/**
 * The shape of the `trustchain` slice. At boot the trust package validates only the member key of
 * a persisted value, as Ledger Sync v1 always did, and keeps the rest as stored.
 */
export const KeyRingStateSchema = z.object({
  /** The key tree this instance joined, or null when it is not a member. */
  trustchain: KeyRingTreeRecordSchema.nullable(),
  /** The key pair of this instance, or null before the trust package generates one. */
  memberCredentials: KeyRingMemberKeyRecordSchema.nullable(),
});
