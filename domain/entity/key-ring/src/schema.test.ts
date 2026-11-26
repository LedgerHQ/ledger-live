import {
  KeyRingMemberKeyRecordSchema,
  KeyRingStateSchema,
  KeyRingTreeRecordSchema,
} from "./schema";
import { mockKeyRingMemberKeyRecord, mockKeyRingTreeRecord } from "./schema.mock";

describe("KeyRingMemberKeyRecordSchema", () => {
  it("accepts a lowercase hex key pair", () => {
    expect(KeyRingMemberKeyRecordSchema.safeParse(mockKeyRingMemberKeyRecord()).success).toBe(true);
  });

  it.each([
    ["a short public key", { pubkey: "02ab" }],
    ["an uppercase private key", { privatekey: "B".repeat(64) }],
    ["a non hex private key", { privatekey: "z".repeat(64) }],
  ])("rejects %s", (_label, overrides) => {
    const record = { ...mockKeyRingMemberKeyRecord(), ...overrides };
    expect(KeyRingMemberKeyRecordSchema.safeParse(record).success).toBe(false);
  });

  it("rejects an unknown field", () => {
    const record = { ...mockKeyRingMemberKeyRecord(), extra: true };
    expect(KeyRingMemberKeyRecordSchema.safeParse(record).success).toBe(false);
  });
});

describe("KeyRingTreeRecordSchema", () => {
  it("accepts a key tree record", () => {
    expect(KeyRingTreeRecordSchema.safeParse(mockKeyRingTreeRecord()).success).toBe(true);
  });

  it("rejects a record without a root id", () => {
    const { rootId: _rootId, ...withoutRootId } = mockKeyRingTreeRecord();
    expect(KeyRingTreeRecordSchema.safeParse(withoutRootId).success).toBe(false);
  });
});

describe("KeyRingStateSchema", () => {
  it("accepts the empty state", () => {
    const empty = { trustchain: null, memberCredentials: null };
    expect(KeyRingStateSchema.parse(empty)).toEqual(empty);
  });
});
