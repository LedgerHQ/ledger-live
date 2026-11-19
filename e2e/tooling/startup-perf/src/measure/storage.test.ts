import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { crc32 } from "node:zlib";
import {
  GENERAL_TERMS_VERSION,
  decodeStorage,
  encodeStorage,
  savedState,
  storageEntries,
  stringValue,
} from "./storage.ts";
import type { Userdata } from "./types.ts";

const PAGE_SIZE = 16_384;

const strings = (values: Map<string, Buffer>) =>
  Object.fromEntries([...values].map(([key, value]) => [key, stringValue(value)]));

const USERDATA: Userdata = {
  names: ["skip-onboarding"],
  settings: { hasCompletedOnboarding: true, shareAnalytics: false },
  accounts: [
    { data: { id: "js:2:ethereum:0xA:" }, version: 1 },
    { data: { id: "js:2:solana:B:" } },
  ],
  postOnboarding: { deviceModelId: "stax" },
};

describe("encodeStorage", () => {
  it("writes MMKV's layout: a zero header, the size holder, then each key and value", () => {
    const { data } = encodeStorage([["k", "v"]]);
    const body = [0xff, 0xff, 0xff, 0x07, 0x01, 0x6b, 0x02, 0x01, 0x76];
    assert.deepEqual([...data.subarray(0, 4 + body.length)], [0, 0, 0, 0, ...body]);
    assert.ok(data.subarray(4 + body.length).every(byte => byte === 0));
  });

  it("writes the size and CRC-32 of the data in the meta file, version 4", () => {
    const { data, meta } = encodeStorage([["settings", '{"a":1}']]);
    const size = meta.readUInt32LE(28);
    assert.equal(meta.readUInt32LE(0), crc32(data.subarray(4, 4 + size)));
    assert.equal(meta.readUInt32LE(4), 4);
    assert.equal(meta.readUInt32LE(8), 1);
    assert.equal(meta.readUInt32LE(32), size);
    assert.equal(meta.readUInt32LE(36), meta.readUInt32LE(0));
  });

  it("pads both files to whole 16 KiB pages", () => {
    const { data, meta } = encodeStorage([["big", "x".repeat(40_000)]]);
    assert.equal(data.length, 3 * PAGE_SIZE);
    assert.equal(meta.length, PAGE_SIZE);
  });
});

describe("decodeStorage", () => {
  it("reads back what encodeStorage wrote, multi-byte lengths and UTF-8 included", () => {
    const entries: Array<[string, string]> = [
      ["migration-status", "completed"],
      ["accounts.active.é", "x".repeat(20_000)],
    ];
    const { data, meta } = encodeStorage(entries);
    assert.deepEqual(strings(decodeStorage(data, meta)), Object.fromEntries(entries));
  });

  it("keeps the last write of a key and applies deletions, as MMKV appends them", () => {
    const append = [0x01, 0x61, 0x02, 0x01, 0x32, 0x01, 0x62, 0x00];
    const { data, meta } = encodeStorage([
      ["a", "1"],
      ["b", "1"],
    ]);
    const size = meta.readUInt32LE(28);
    Buffer.from(append).copy(data, 4 + size);
    meta.writeUInt32LE(size + append.length, 28);
    assert.deepEqual(strings(decodeStorage(data, meta)), { a: "2" });
  });

  it("takes the size from the data header before meta version 3", () => {
    const { data, meta } = encodeStorage([["a", "1"]]);
    data.writeUInt32LE(meta.readUInt32LE(28), 0);
    meta.writeUInt32LE(2, 4);
    assert.deepEqual(strings(decodeStorage(data, meta)), { a: "1" });
  });

  it("fails on a size past the end of the data", () => {
    const { data, meta } = encodeStorage([["a", "1"]]);
    meta.writeUInt32LE(data.length, 28);
    assert.throws(() => decodeStorage(data, meta), /past the end/);
  });
});

describe("storageEntries", () => {
  it("saves what the bridge imported: settings with the terms, accounts in order, post-onboarding", () => {
    const entries = storageEntries(USERDATA);
    assert.deepEqual(
      entries.map(([key]) => key),
      [
        "migration-status",
        "settings",
        "accounts.active.js:2:ethereum:0xA:",
        "accounts.active.js:2:solana:B:",
        "accounts.sort",
        "postOnboarding",
      ],
    );
    const values = Object.fromEntries(entries);
    assert.equal(values["migration-status"], "completed");
    assert.deepEqual(JSON.parse(values.settings), {
      hasCompletedOnboarding: true,
      shareAnalytics: false,
      generalTermsVersionAccepted: GENERAL_TERMS_VERSION,
    });
    assert.deepEqual(JSON.parse(values["accounts.active.js:2:solana:B:"]), {
      data: { id: "js:2:solana:B:" },
      version: 1,
    });
    assert.deepEqual(JSON.parse(values["accounts.sort"]), ["js:2:ethereum:0xA:", "js:2:solana:B:"]);
  });

  it("saves an empty account list and no post-onboarding when the userdata has none", () => {
    const values = Object.fromEntries(
      storageEntries({ ...USERDATA, accounts: [], postOnboarding: undefined }),
    );
    assert.equal(values["accounts.sort"], "[]");
    assert.equal("postOnboarding" in values, false);
  });

  it("fails on an account without an id", () => {
    assert.throws(() => storageEntries({ ...USERDATA, accounts: [{ data: {} }] }), /no id/);
  });
});

describe("savedState", () => {
  it("counts the saved accounts and sees the accepted terms", () => {
    const { data, meta } = encodeStorage(storageEntries(USERDATA));
    assert.deepEqual(savedState(decodeStorage(data, meta)), { accounts: 2, termsAccepted: true });
  });

  it("finds neither in the storage of an app that dropped the file", () => {
    const { data, meta } = encodeStorage([
      ["migration-status", "completed"],
      ["settings", "{}"],
    ]);
    assert.deepEqual(savedState(decodeStorage(data, meta)), { accounts: 0, termsAccepted: false });
  });
});
