import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { InMemoryKeychain } from "../testing/in-memory-keychain";
import { deletePrivateKey, hasStoredKey, loadMemberCredentials, savePrivateKey } from "./keychain";
import { _setTestKeychain } from "./keychain-entry";
import { resetTestSeams } from "../shared/test-seam";

let keychain: InMemoryKeychain;
const opened: unknown[][] = [];

beforeAll(() => {
  _setTestKeychain((service, account, options) => {
    opened.push([service, account, options]);
    return keychain.open(service, account);
  });
});
afterAll(resetTestSeams);

describe("ring member key keychain entry", () => {
  beforeEach(() => {
    keychain = new InMemoryKeychain();
    opened.length = 0;
  });

  // Unpinned on purpose: only Agent Intent and API auth entries require a Secret Service.
  it("is built without store options", () => {
    hasStoredKey();

    expect(opened).toHaveLength(1);
    expect(opened[0][2]).toBeUndefined();
  });

  it("reports a deleted key as deleted", async () => {
    await savePrivateKey("deadbeef");

    expect(deletePrivateKey()).toBe(true);
    expect(keychain.entries.size).toBe(0);
  });

  it("reports an absent key as deleted", () => {
    expect(deletePrivateKey()).toBe(true);
  });

  it("reports a failed delete as not deleted", () => {
    keychain.deleteError = new Error("keychain locked");

    expect(deletePrivateKey()).toBe(false);
  });

  it("treats an unreadable keychain as holding no key", async () => {
    keychain.readError = new Error("keychain locked");

    expect(hasStoredKey()).toBe(false);
    expect(await loadMemberCredentials()).toBeNull();
  });
});
