import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

const constructed: unknown[][] = [];
let stored: string | null;
let deleteResult: () => boolean;
let backendError: Error | undefined;

mock.module("@napi-rs/keyring", () => ({
  Entry: class {
    constructor(...args: unknown[]) {
      constructed.push(args);
    }
    getPassword() {
      if (backendError) throw backendError;
      return stored;
    }
    deletePassword() {
      return deleteResult();
    }
  },
}));
afterAll(() => mock.restore());

const { deletePrivateKey, hasStoredKey, loadMemberCredentials } = await import("./keychain");

describe("ring member key keychain entry", () => {
  beforeEach(() => {
    constructed.length = 0;
    stored = null;
    deleteResult = () => true;
    backendError = undefined;
  });

  // Unpinned on purpose: only Agent Intent and API auth entries require a Secret Service.
  it("is built without store options", () => {
    hasStoredKey();

    expect(constructed).toHaveLength(1);
    expect(constructed[0]).toHaveLength(2);
  });

  it("reports a deleted key as deleted", () => {
    expect(deletePrivateKey()).toBe(true);
  });

  it("reports an absent key as deleted", () => {
    deleteResult = () => false;

    expect(deletePrivateKey()).toBe(true);
  });

  it("reports a failed delete as not deleted", () => {
    deleteResult = () => {
      throw new Error("keychain locked");
    };

    expect(deletePrivateKey()).toBe(false);
  });

  it("treats an unreadable keychain as holding no key", async () => {
    backendError = new Error("keychain locked");

    expect(hasStoredKey()).toBe(false);
    expect(await loadMemberCredentials()).toBeNull();
  });
});
