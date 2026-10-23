import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { InMemoryKeychain } from "../testing/in-memory-keychain";
import { loadAgentIntentSecretKey, saveAgentIntentSecretKey } from "./agent-intent-keychain";
import { _setTestKeychain } from "./keychain-entry";

const keychain = new InMemoryKeychain();
beforeAll(() => _setTestKeychain(keychain.open));
afterAll(() => _setTestKeychain(null));

describe("loadAgentIntentSecretKey", () => {
  beforeEach(() => {
    keychain.entries.clear();
    keychain.readError = undefined;
  });

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
