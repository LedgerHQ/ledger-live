import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { APP_NAME } from "../session/session-store";
import { InMemoryKeychain } from "../testing/in-memory-keychain";
import {
  _resetApiAuthIdentity,
  apiAuthKeychainAccount,
  loadApiAuthIdentity,
} from "./api-auth-identity";
import { pubkeyFromPrivatekey } from "./crypto";
import { _setTestKeychain } from "./keychain-entry";

const origStateHome = process.env.XDG_STATE_HOME;
let keychain: InMemoryKeychain;

function storedKey(): string | undefined {
  return keychain.entries.get(`${APP_NAME}:${apiAuthKeychainAccount()}`);
}

function useProfile(name: string): void {
  process.env.XDG_STATE_HOME = `/tmp/wallet-cli-api-auth-test/${name}`;
}

beforeEach(() => {
  keychain = new InMemoryKeychain();
  _setTestKeychain(keychain.open);
  _resetApiAuthIdentity();
  useProfile("a");
});

afterEach(() => {
  _setTestKeychain(null);
  if (origStateHome === undefined) delete process.env.XDG_STATE_HOME;
  else process.env.XDG_STATE_HOME = origStateHome;
});

describe("loadApiAuthIdentity", () => {
  it("never carries a trustchain", () => {
    expect(loadApiAuthIdentity().trustchain).toBeNull();
  });

  it("creates a key on first use and stores it under the profile's api-auth account", () => {
    const { memberCredentials } = loadApiAuthIdentity();

    expect(apiAuthKeychainAccount()).toStartWith("api-auth-key-");
    expect(storedKey()).toBe(memberCredentials.privatekey);
    expect(memberCredentials.pubkey).toBe(pubkeyFromPrivatekey(memberCredentials.privatekey));
  });

  it("reuses the stored key on later runs", () => {
    const first = loadApiAuthIdentity().memberCredentials;
    _resetApiAuthIdentity();
    const second = loadApiAuthIdentity().memberCredentials;

    expect(second).toEqual(first);
    expect(keychain.entries.size).toBe(1);
  });

  it("keeps a separate key per profile", () => {
    const keyA = loadApiAuthIdentity().memberCredentials;
    useProfile("b");
    const keyB = loadApiAuthIdentity().memberCredentials;

    expect(keyB.privatekey).not.toBe(keyA.privatekey);
    expect(keychain.entries.size).toBe(2);
  });

  it("replaces a corrupt entry with a fresh key", () => {
    keychain.entries.set(`${APP_NAME}:${apiAuthKeychainAccount()}`, "not-hex");

    const { memberCredentials } = loadApiAuthIdentity();

    expect(memberCredentials.privatekey).not.toBe("not-hex");
    expect(storedKey()).toBe(memberCredentials.privatekey);
  });

  it("falls back to a one-off key when the keychain cannot be read", () => {
    keychain.readError = new Error("no secret service");

    const { memberCredentials } = loadApiAuthIdentity();

    expect(memberCredentials.pubkey).toBe(pubkeyFromPrivatekey(memberCredentials.privatekey));
    expect(keychain.entries.size).toBe(0);
  });

  it("keeps the one-off key for the rest of the run", () => {
    keychain.readError = new Error("no secret service");

    const first = loadApiAuthIdentity().memberCredentials;
    const second = loadApiAuthIdentity().memberCredentials;

    expect(second).toEqual(first);
  });

  it("still returns the new key when the keychain cannot store it", () => {
    keychain.writeError = new Error("keychain locked");

    const { memberCredentials } = loadApiAuthIdentity();

    expect(memberCredentials.pubkey).toBe(pubkeyFromPrivatekey(memberCredentials.privatekey));
  });
});
