import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { InMemoryKeychain } from "../testing/in-memory-keychain";
import { overridePlatform } from "../testing/os-keychain";
import {
  deleteAgentIntentSecretKey,
  hasAgentIntentSecretKey,
  loadAgentIntentSecretKey,
  saveAgentIntentSecretKey,
} from "./agent-intent-keychain";
import {
  _setTestKeychain,
  _setTestKeychainProbe,
  assertOsKeychainAvailable,
} from "./keychain-entry";
import { KeychainUnavailableError } from "./keychain-unavailable-error";
import { resetTestSeams } from "../shared/test-seam";

const SECRET_SERVICE_ONLY = { linux: { store: "secret-service" } };

let keychain: InMemoryKeychain;
const opened: unknown[][] = [];
let reads: number;

beforeAll(() => {
  _setTestKeychain((service, account, options) => {
    opened.push([service, account, options]);
    const entry = keychain.open(service, account);
    return {
      ...entry,
      getPassword: () => {
        reads++;
        return entry.getPassword();
      },
    };
  });
});
afterAll(resetTestSeams);

beforeEach(() => {
  keychain = new InMemoryKeychain();
  opened.length = 0;
  reads = 0;
});

describe("Agent Intent keychain entries", () => {
  it("are pinned to the Secret Service", async () => {
    await saveAgentIntentSecretKey("bot", "deadbeef");
    hasAgentIntentSecretKey("bot");
    deleteAgentIntentSecretKey("bot");

    expect(opened).toHaveLength(3);
    for (const args of opened) expect(args[2]).toEqual(SECRET_SERVICE_ONLY);
  });

  it("report a failed delete, without throwing, when the entry can't be built", () => {
    keychain.openError = new Error("Platform failure: DBus error");

    expect(deleteAgentIntentSecretKey("bot")).toBe(false);
  });

  it("throw from the existence check, instead of reporting no key, when the entry can't be read", async () => {
    await saveAgentIntentSecretKey("bot", "deadbeef");
    keychain.readError = new Error("Secret Service: object locked");

    expect(() => hasAgentIntentSecretKey("bot")).toThrow("object locked");
  });

  it("report an absent key as deleted", () => {
    expect(deleteAgentIntentSecretKey("bot")).toBe(true);
  });

  it("report a delete that throws as failed", async () => {
    await saveAgentIntentSecretKey("bot", "deadbeef");
    keychain.deleteError = new Error("keychain locked");

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
    expect(opened).toEqual([["ledger-wallet-cli-probe", "probe", SECRET_SERVICE_ONLY]]);
    expect(reads).toBe(0);
  });

  it("passes when the Secret Service is reachable but a read would fail", () => {
    keychain.readError = new Error("Secret Service: object locked");

    expect(() => assertOsKeychainAvailable("Hint.")).not.toThrow();
  });

  it("throws KeychainUnavailableError when the pinned entry can't be built", () => {
    keychain.openError = new Error("Platform failure: DBus error");

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
    keychain.readError = new Error("keychain locked");
    await expect(loadAgentIntentSecretKey("bot")).rejects.toThrow("keychain locked");
  });
});
