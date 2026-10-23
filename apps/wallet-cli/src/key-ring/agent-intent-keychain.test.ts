import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { overridePlatform } from "../testing/os-keychain";

const SECRET_SERVICE_ONLY = { linux: { store: "secret-service" } };

const store = new Map<string, string>();
const constructed: unknown[][] = [];
let constructorError: Error | undefined;
let backendError: Error | undefined;
let deleteError: Error | undefined;
let reads: number;

mock.module("@napi-rs/keyring", () => ({
  Entry: class {
    #k: string;
    constructor(svc: string, acc: string, ...options: unknown[]) {
      constructed.push([svc, acc, ...options]);
      if (constructorError) throw constructorError;
      this.#k = `${svc}:${acc}`;
    }
    setPassword(v: string) {
      store.set(this.#k, v);
    }
    getPassword() {
      reads++;
      if (backendError) throw backendError;
      return store.get(this.#k) ?? null;
    }
    deletePassword() {
      if (deleteError) throw deleteError;
      return store.delete(this.#k);
    }
  },
}));
afterAll(() => mock.restore());

const {
  deleteAgentIntentSecretKey,
  hasAgentIntentSecretKey,
  loadAgentIntentSecretKey,
  saveAgentIntentSecretKey,
} = await import("./agent-intent-keychain");
const { assertOsKeychainAvailable, _setTestKeychainProbe } = await import("./keychain-entry");
const { KeychainUnavailableError } = await import("./keychain-unavailable-error");

beforeEach(() => {
  store.clear();
  constructed.length = 0;
  constructorError = undefined;
  backendError = undefined;
  deleteError = undefined;
  reads = 0;
});

describe("Agent Intent keychain entries", () => {
  it("are pinned to the Secret Service", async () => {
    await saveAgentIntentSecretKey("bot", "deadbeef");
    hasAgentIntentSecretKey("bot");
    deleteAgentIntentSecretKey("bot");

    expect(constructed).toHaveLength(3);
    for (const args of constructed) expect(args[2]).toEqual(SECRET_SERVICE_ONLY);
  });

  it("report a failed delete, without throwing, when the entry can't be built", () => {
    constructorError = new Error("Platform failure: DBus error");

    expect(deleteAgentIntentSecretKey("bot")).toBe(false);
  });

  it("throw from the existence check, instead of reporting no key, when the entry can't be read", async () => {
    await saveAgentIntentSecretKey("bot", "deadbeef");
    backendError = new Error("Secret Service: object locked");

    expect(() => hasAgentIntentSecretKey("bot")).toThrow("object locked");
  });

  it("report an absent key as deleted", () => {
    expect(deleteAgentIntentSecretKey("bot")).toBe(true);
  });

  it("report a delete that throws as failed", async () => {
    await saveAgentIntentSecretKey("bot", "deadbeef");
    deleteError = new Error("keychain locked");

    expect(deleteAgentIntentSecretKey("bot")).toBe(false);
  });
});

describe("default Secret Service probe", () => {
  let restorePlatform: () => void;

  beforeEach(() => {
    restorePlatform = overridePlatform("linux");
    _setTestKeychainProbe(null);
  });

  afterEach(() => restorePlatform());

  it("builds a pinned probe entry without reading it", () => {
    expect(() => assertOsKeychainAvailable("Hint.")).not.toThrow();
    expect(constructed).toEqual([["ledger-wallet-cli-probe", "probe", SECRET_SERVICE_ONLY]]);
    expect(reads).toBe(0);
  });

  it("passes when the Secret Service is reachable but a read would fail", () => {
    backendError = new Error("Secret Service: object locked");

    expect(() => assertOsKeychainAvailable("Hint.")).not.toThrow();
  });

  it("throws KeychainUnavailableError when the pinned entry can't be built", () => {
    constructorError = new Error("Platform failure: DBus error");

    expect(() => assertOsKeychainAvailable("Hint.")).toThrow(KeychainUnavailableError);
  });
});

describe("loadAgentIntentSecretKey", () => {
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
