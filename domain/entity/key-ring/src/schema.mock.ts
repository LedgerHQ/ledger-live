import { KeyRingMemberKeyRecordSchema, KeyRingTreeRecordSchema } from "./schema";
import type { KeyRingMemberKeyRecord, KeyRingTreeRecord } from "./types";

/**
 * A valid key tree record with fixed fake values. Overrides are validated against the schema, so
 * an invalid override throws.
 *
 * @example
 * ```ts
 * const tree = mockKeyRingTreeRecord({ rootId: "other-root-id" });
 * store.dispatch(keyRingTreeSet(tree));
 * ```
 */
export function mockKeyRingTreeRecord(overrides?: Partial<KeyRingTreeRecord>): KeyRingTreeRecord {
  return KeyRingTreeRecordSchema.parse({
    rootId: "mock-root-id",
    walletSyncEncryptionKey: "mock-encryption-key",
    applicationPath: "m/0'/16'/0'",
    ...overrides,
  });
}

/**
 * A member key record in the stored hex format, not a real key pair: tests that sign or derive
 * need a key from the trust package. Overrides are validated against the schema.
 */
export function mockKeyRingMemberKeyRecord(
  overrides?: Partial<KeyRingMemberKeyRecord>,
): KeyRingMemberKeyRecord {
  return KeyRingMemberKeyRecordSchema.parse({
    pubkey: `02${"a".repeat(64)}`,
    privatekey: "b".repeat(64),
    ...overrides,
  });
}
