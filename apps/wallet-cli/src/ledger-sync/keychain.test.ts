import { describe, expect, it } from "bun:test";
import {
  LedgerSyncCorruptKeychainError,
  loadLedgerSyncMemberCredentials,
  saveLedgerSyncMemberCredentials,
  type LedgerSyncKeychainEntry,
} from "./keychain";

function fakeEntry(
  initial: string | null = null,
): LedgerSyncKeychainEntry & { value: string | null } {
  const entry = {
    value: initial,
    getPassword: () => entry.value,
    setPassword: (v: string) => {
      entry.value = v;
    },
  };
  return entry;
}

describe("Ledger Sync keychain", () => {
  it("round-trips member credentials through a keychain entry", () => {
    const entry = fakeEntry();
    saveLedgerSyncMemberCredentials({ privatekey: "aa11", pubkey: "bb22" }, entry);

    expect(loadLedgerSyncMemberCredentials(entry)).toEqual({ privatekey: "aa11", pubkey: "bb22" });
  });

  it("reads a Windows-written entry with CRLF line endings", () => {
    expect(loadLedgerSyncMemberCredentials(fakeEntry("aa11\r\nbb22\r\n"))).toEqual({
      privatekey: "aa11",
      pubkey: "bb22",
    });
  });

  it("returns null when no entry is stored", () => {
    expect(loadLedgerSyncMemberCredentials(fakeEntry(null))).toBeNull();
    expect(loadLedgerSyncMemberCredentials(fakeEntry(""))).toBeNull();
  });

  it("returns null when the keychain itself can't be read", () => {
    const entry = {
      getPassword: () => {
        throw new Error("Platform secure storage failure");
      },
      setPassword: () => {},
    };

    expect(loadLedgerSyncMemberCredentials(entry)).toBeNull();
  });

  it("throws a dedicated, actionable error for a structurally corrupt entry", () => {
    const load = () => loadLedgerSyncMemberCredentials(fakeEntry("only-one-line"));

    expect(load).toThrow(LedgerSyncCorruptKeychainError);
    expect(load).toThrow(/ledger-sync destroy.*ledger-sync enroll/);
  });

  it("never echoes the stored secret in the corrupt-entry error", () => {
    try {
      loadLedgerSyncMemberCredentials(fakeEntry("super-secret-private-key"));
      throw new Error("expected a throw");
    } catch (e) {
      expect(String((e as Error).message)).not.toContain("super-secret-private-key");
    }
  });
});
