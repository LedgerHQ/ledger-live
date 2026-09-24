import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  _setTestApiAuthKeychain,
  apiAuthKeychainAccount,
  loadApiAuthIdentity,
  type ApiAuthKeychain,
} from "./api-auth-identity";
import { pubkeyFromPrivatekey } from "./crypto";

const origStateHome = process.env.XDG_STATE_HOME;
let entries: Map<string, string>;

function mapKeychain(): ApiAuthKeychain {
  return {
    getPassword: account => entries.get(account) ?? null,
    setPassword: (account, value) => {
      entries.set(account, value);
    },
  };
}

function useProfile(name: string): void {
  process.env.XDG_STATE_HOME = `/tmp/wallet-cli-api-auth-test/${name}`;
}

beforeEach(() => {
  entries = new Map();
  _setTestApiAuthKeychain(mapKeychain());
  useProfile("a");
});

afterEach(() => {
  _setTestApiAuthKeychain(null);
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
    expect(entries.get(apiAuthKeychainAccount())).toBe(memberCredentials.privatekey);
    expect(memberCredentials.pubkey).toBe(pubkeyFromPrivatekey(memberCredentials.privatekey));
  });

  it("reuses the stored key on later runs", () => {
    const first = loadApiAuthIdentity().memberCredentials;
    const second = loadApiAuthIdentity().memberCredentials;

    expect(second).toEqual(first);
    expect(entries.size).toBe(1);
  });

  it("keeps a separate key per profile", () => {
    const keyA = loadApiAuthIdentity().memberCredentials;
    useProfile("b");
    const keyB = loadApiAuthIdentity().memberCredentials;

    expect(keyB.privatekey).not.toBe(keyA.privatekey);
    expect(entries.size).toBe(2);
  });

  it("replaces a corrupt entry with a fresh key", () => {
    entries.set(apiAuthKeychainAccount(), "not-hex");

    const { memberCredentials } = loadApiAuthIdentity();

    expect(memberCredentials.privatekey).not.toBe("not-hex");
    expect(entries.get(apiAuthKeychainAccount())).toBe(memberCredentials.privatekey);
  });

  it("falls back to a one-off key when the keychain cannot be read", () => {
    let writes = 0;
    _setTestApiAuthKeychain({
      getPassword: () => {
        throw new Error("no secret service");
      },
      setPassword: () => {
        writes++;
      },
    });

    const { memberCredentials } = loadApiAuthIdentity();

    expect(memberCredentials.pubkey).toBe(pubkeyFromPrivatekey(memberCredentials.privatekey));
    expect(writes).toBe(0);
  });

  it("still returns the new key when the keychain cannot store it", () => {
    _setTestApiAuthKeychain({
      getPassword: () => null,
      setPassword: () => {
        throw new Error("keychain locked");
      },
    });

    const { memberCredentials } = loadApiAuthIdentity();

    expect(memberCredentials.pubkey).toBe(pubkeyFromPrivatekey(memberCredentials.privatekey));
  });
});
