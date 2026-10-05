import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";

const store = new Map<string, string>();
let backendError: Error | undefined;

mock.module("@napi-rs/keyring", () => ({
  Entry: class {
    #k: string;
    constructor(svc: string, acc: string) {
      this.#k = `${svc}:${acc}`;
    }
    setPassword(v: string) {
      store.set(this.#k, v);
    }
    getPassword() {
      if (backendError) throw backendError;
      return store.get(this.#k) ?? null;
    }
    deletePassword() {
      store.delete(this.#k);
    }
  },
}));
afterAll(() => mock.restore());

const { loadAgentIntentSecretKey, saveAgentIntentSecretKey } =
  await import("./agent-intent-keychain");

describe("loadAgentIntentSecretKey", () => {
  beforeEach(() => {
    store.clear();
    backendError = undefined;
  });

  it("returns the stored secret key", async () => {
    await saveAgentIntentSecretKey("bot", "deadbeef");
    expect(await loadAgentIntentSecretKey("bot")).toBe("deadbeef");
  });

  it("returns null when no entry exists", async () => {
    expect(await loadAgentIntentSecretKey("bot")).toBeNull();
  });

  it("propagates keychain backend errors instead of reporting a missing key", async () => {
    backendError = new Error("keychain locked");
    await expect(loadAgentIntentSecretKey("bot")).rejects.toThrow("keychain locked");
  });
});
