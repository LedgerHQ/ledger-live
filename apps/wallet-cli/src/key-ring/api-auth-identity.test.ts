import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { Entry } from "@napi-rs/keyring";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  _setTestApiAuthKeychain,
  apiAuthKeychainAccount,
  loadApiAuthIdentity,
  type ApiAuthKeychain,
} from "./api-auth-identity";
import { pubkeyFromPrivatekey } from "./crypto";
import { _setTestKeychainProbe } from "./keychain-entry";
import { installOutputCapture } from "../shared/ui";
import { failingKeychainProbe, overridePlatform } from "../testing/os-keychain";

const origStateHome = process.env.XDG_STATE_HOME;
let entries: Map<string, string>;
let stderr: string[];
let restoreOutput: () => void;

function mapKeychain(): ApiAuthKeychain {
  return {
    getPassword: account => entries.get(account) ?? null,
    setPassword: (account, value) => {
      entries.set(account, value);
    },
  };
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
  entries = new Map();
  stderr = [];
  restoreOutput = installOutputCapture({ stderr: chunk => stderr.push(chunk) });
  _setTestApiAuthKeychain(mapKeychain());
  useProfile("a");
});

afterEach(() => {
  restoreOutput();
  _setTestApiAuthKeychain(null);
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
    expect(entries.get(apiAuthKeychainAccount())).toBe(memberCredentials.privatekey);
    expect(memberCredentials.pubkey).toBe(pubkeyFromPrivatekey(memberCredentials.privatekey));
  });

  it("reuses the stored key on later runs", () => {
    const first = loadCredentials();
    _setTestApiAuthKeychain(mapKeychain());
    const second = loadCredentials();

    expect(second).toEqual(first);
    expect(entries.size).toBe(1);
  });

  it("keeps a separate key per profile", () => {
    const keyA = loadCredentials();
    useProfile("b");
    const keyB = loadCredentials();

    expect(keyB.privatekey).not.toBe(keyA.privatekey);
    expect(entries.size).toBe(2);
  });

  it("replaces a corrupt entry with a fresh key", () => {
    entries.set(apiAuthKeychainAccount(), "not-hex");

    const memberCredentials = loadCredentials();

    expect(memberCredentials.privatekey).not.toBe("not-hex");
    expect(entries.get(apiAuthKeychainAccount())).toBe(memberCredentials.privatekey);
  });

  it("sends no credentials and warns once when the keychain cannot be read", () => {
    let writes = 0;
    _setTestApiAuthKeychain({
      getPassword: () => {
        throw new Error("no secret service");
      },
      setPassword: () => {
        writes++;
      },
    });

    expect(loadApiAuthIdentity().memberCredentials).toBeNull();
    expect(loadApiAuthIdentity().memberCredentials).toBeNull();
    expect(writes).toBe(0);
    expect(stderr).toHaveLength(1);
    expect(stderr[0]).toMatch(/No usable OS keychain/);
  });

  it("sends no credentials and warns once when the keychain cannot store the new key", () => {
    let writes = 0;
    _setTestApiAuthKeychain({
      getPassword: () => null,
      setPassword: () => {
        writes++;
        throw new Error("keychain locked");
      },
    });

    expect(loadApiAuthIdentity().memberCredentials).toBeNull();
    expect(loadApiAuthIdentity().memberCredentials).toBeNull();
    expect(writes).toBe(1);
    expect(stderr).toHaveLength(1);
    expect(stderr[0]).toMatch(/Could not save the Ledger API auth key/);
  });

  it("probes for a Secret Service on Linux before reading the OS keychain", () => {
    const restorePlatform = overridePlatform("linux");
    _setTestKeychainProbe(failingKeychainProbe);
    // Guards the real keychain: any read or write that slips past the probe throws here.
    const read = spyOn(Entry.prototype, "getPassword").mockImplementation(() => {
      throw new Error("real keychain read");
    });
    const write = spyOn(Entry.prototype, "setPassword").mockImplementation(() => {
      throw new Error("real keychain write");
    });
    _setTestApiAuthKeychain(null);
    try {
      expect(loadApiAuthIdentity().memberCredentials).toBeNull();
      expect(read).not.toHaveBeenCalled();
      expect(write).not.toHaveBeenCalled();
      expect(stderr).toEqual([expect.stringMatching(/No usable OS keychain/)]);
    } finally {
      read.mockRestore();
      write.mockRestore();
      _setTestKeychainProbe(null);
      restorePlatform();
    }
  });
});
