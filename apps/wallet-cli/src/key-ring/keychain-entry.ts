import { Entry } from "@napi-rs/keyring";
import { createHash } from "node:crypto";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";

const SERVICE = APP_NAME;

/**
 * A namespaced OS-keychain entry, shared by every credential kind wallet-cli stores (`ring`'s
 * member key, Agent Intent profile keys, Ledger Sync member credentials). `hashParts` are hashed
 * together with the state dir so distinct profiles/namespaces/parallel test workers never
 * cross-read each other's entries; `accountPrefix` only affects the human-readable account name,
 * never the hash.
 *
 * The exact `(accountPrefix, hashParts)` pairing for each existing caller is preserved byte-for-byte
 * from before this was factored out — changing either would silently orphan already-stored
 * keychain entries, so treat both as load-bearing, not cosmetic.
 */
export function keychainEntry(accountPrefix: string, ...hashParts: string[]): Entry {
  const digest = createHash("sha256")
    .update([stateDir(APP_NAME), ...hashParts].join(" "))
    .digest("hex")
    .slice(0, 16);
  return new Entry(SERVICE, `${accountPrefix}-${digest}`);
}

/**
 * "Deleted" and "already absent" both satisfy the postcondition (no key remains), so both collapse
 * to `true`; only a thrown backend error (the key may still persist) returns `false`.
 */
export function deleteKeychainEntry(entry: Entry): boolean {
  try {
    entry.deletePassword();
    return true;
  } catch {
    return false;
  }
}

export function hasKeychainEntry(entry: Entry): boolean {
  try {
    return entry.getPassword() != null;
  } catch {
    return false;
  }
}

/**
 * CRLF-tolerant line split: a keychain entry written on Windows may carry a trailing `\r`, and
 * `trim()` alone only strips the string's outer ends, so a bare `split("\n")` would leave a
 * trailing `\r` on an inner line.
 */
export function splitKeychainLines(stored: string): string[] {
  return stored.trim().split(/\r?\n/);
}
