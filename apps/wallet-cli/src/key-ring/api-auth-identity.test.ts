import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { APP_NAME } from "../session/session-store";
import { InMemoryKeychain } from "../testing/in-memory-keychain";
import {
  _resetApiAuthIdentity,
  apiAuthKeychainAccount,
  loadApiAuthIdentity,
} from "./api-auth-identity";
import { pubkeyFromPrivatekey } from "./crypto";
import { _setTestKeychain, _setTestKeychainProbe } from "./keychain-entry";
import { installOutputCapture } from "../shared/ui";
import { failingKeychainProbe, overridePlatform } from "../testing/os-keychain";
import { resetTestSeams } from "../shared/test-seam";

const origStateHome = process.env.XDG_STATE_HOME;
let keychain: InMemoryKeychain;
let stderr: string[];
let restoreOutput: () => void;

function storedKey(): string | undefined {
  return keychain.entries.get(`${APP_NAME}:${apiAuthKeychainAccount()}`);
}

function loadCredentials(): MemberCredentials {
  const { memberCredentials } = loadApiAuthIdentity();
  if (!memberCredentials) throw new Error("expected API auth credentials");
  return memberCredentials;
}

function useProfile(name: string): void {
  process.env.XDG_STATE_HOME = `/tmp/wallet-cli-api-auth-test/${name}`;
}

beforeEach(() => {
  keychain = new InMemoryKeychain();
  stderr = [];
  restoreOutput = installOutputCapture({ stderr: chunk => stderr.push(chunk) });
  _setTestKeychain(keychain.open);
  _resetApiAuthIdentity();
  useProfile("a");
});

afterEach(() => {
  restoreOutput();
  resetTestSeams();
  if (origStateHome === undefined) delete process.env.XDG_STATE_HOME;
  else process.env.XDG_STATE_HOME = origStateHome;
});

describe("loadApiAuthIdentity", () => {
  it("never carries a trustchain", () => {
    expect(loadApiAuthIdentity().trustchain).toBeNull();
  });

  it("creates a key on first use and stores it under the profile's api-auth account", () => {
    const memberCredentials = loadCredentials();

    expect(apiAuthKeychainAccount()).toStartWith("api-auth-key-");
    expect(storedKey()).toBe(memberCredentials.privatekey);
    expect(memberCredentials.pubkey).toBe(pubkeyFromPrivatekey(memberCredentials.privatekey));
  });

  it("reuses the stored key on later runs", () => {
    const first = loadCredentials();
    _resetApiAuthIdentity();
    const second = loadCredentials();

    expect(second).toEqual(first);
    expect(keychain.entries.size).toBe(1);
  });

  it("keeps a separate key per profile", () => {
    const keyA = loadCredentials();
    useProfile("b");
    const keyB = loadCredentials();

    expect(keyB.privatekey).not.toBe(keyA.privatekey);
    expect(keychain.entries.size).toBe(2);
  });

  it("replaces a corrupt entry with a fresh key", () => {
    keychain.entries.set(`${APP_NAME}:${apiAuthKeychainAccount()}`, "not-hex");

    const memberCredentials = loadCredentials();

    expect(memberCredentials.privatekey).not.toBe("not-hex");
    expect(storedKey()).toBe(memberCredentials.privatekey);
  });

  it("sends no credentials and warns once when the keychain cannot be read", () => {
    keychain.readError = new Error("no secret service");

    expect(loadApiAuthIdentity().memberCredentials).toBeNull();
    expect(loadApiAuthIdentity().memberCredentials).toBeNull();
    expect(keychain.entries.size).toBe(0);
    expect(stderr).toHaveLength(1);
    expect(stderr[0]).toMatch(/No usable OS keychain/);
  });

  it("sends no credentials and warns once when the keychain cannot store the new key", () => {
    keychain.writeError = new Error("keychain locked");

    expect(loadApiAuthIdentity().memberCredentials).toBeNull();
    expect(loadApiAuthIdentity().memberCredentials).toBeNull();
    expect(keychain.entries.size).toBe(0);
    expect(stderr).toHaveLength(1);
    expect(stderr[0]).toMatch(/Could not save the Ledger API auth key/);
  });

  it("probes for a Secret Service on Linux before reading the OS keychain", () => {
    const restorePlatform = overridePlatform("linux");
    _setTestKeychainProbe(failingKeychainProbe);
    let opened = 0;
    _setTestKeychain((service, account) => {
      opened++;
      return keychain.open(service, account);
    });
    try {
      expect(loadApiAuthIdentity().memberCredentials).toBeNull();
      expect(opened).toBe(0);
      expect(stderr).toEqual([expect.stringMatching(/No usable OS keychain/)]);
    } finally {
      restorePlatform();
    }
  });
});
