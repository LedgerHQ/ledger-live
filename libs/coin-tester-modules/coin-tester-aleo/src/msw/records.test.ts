import { correctRecordVersion, makeRecordResolver, type RecordStore } from "./records";

const PLAINTEXT =
  "{\n  owner: aleo1owner.private,\n  microcredits: 5u64.private,\n  _nonce: 1group.public,\n  _version: 0u8.public\n}";

function storeWith(plaintexts: Record<string, string>): RecordStore {
  return { plaintextByCommitment: commitment => plaintexts[commitment] } as RecordStore;
}

describe("correctRecordVersion", () => {
  it("bumps _version by one", () => {
    expect(correctRecordVersion(PLAINTEXT)).toContain("_version: 1u8.public");
  });

  it("throws on a plaintext with no _version", () => {
    expect(() => correctRecordVersion("{ owner: aleo1owner.private }")).toThrow(/no _version/);
  });
});

describe("makeRecordResolver", () => {
  it("resolves a commitment to its corrected plaintext", () => {
    const resolve = makeRecordResolver(storeWith({ "1field": PLAINTEXT }));

    expect(resolve("1field")).toBe(correctRecordVersion(PLAINTEXT));
  });

  it("throws on a commitment the store never scanned", () => {
    const resolve = makeRecordResolver(storeWith({}));

    expect(() => resolve("2field")).toThrow(/no record plaintext for commitment 2field/);
  });
});
