import { Entry } from "@napi-rs/keyring";
import { createHash } from "node:crypto";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";
import { encryptData, decryptData, hexToBytes } from "./crypto";

const SERVICE = APP_NAME;
const ENC_PREFIX = "ENC:";

/**
 * A namespaced OS-keychain entry. `hashParts` are hashed together with the state dir so distinct
 * profiles/namespaces/parallel test workers never cross-read each other's entries; `accountPrefix`
 * only affects the human-readable account name, never the hash.
 *
 * Once a caller starts using a given `(accountPrefix, hashParts)` pairing, that pairing becomes
 * load-bearing for it — changing either would silently orphan that caller's already-stored entries.
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

/**
 * Encrypt-and-`ENC:`-prefix a secret when a `wrappingKey` is given, otherwise return it verbatim.
 * This is the shared keychain-wrap home for wallet-cli's credential stores — Agent Intent's profile
 * keys use it here; `ring`'s `keychain.ts` and Ledger Sync's `keychain.ts` adopt the same functions
 * in NTTVS-728, so all three never drift onto different wrap formats.
 */
export async function wrapSecret(secretHex: string, wrappingKey?: CryptoKey): Promise<string> {
  if (!wrappingKey) return secretHex;
  const ct = await encryptData(wrappingKey, new TextEncoder().encode(secretHex));
  return `${ENC_PREFIX}${Buffer.from(ct).toString("hex")}`;
}

/**
 * Reverse of `wrapSecret`. `stored` must already be a single trimmed line (callers split multi-line
 * entries themselves — see `splitKeychainLines`). Callers pass their own `() => never` for the two
 * distinct failure modes so `instanceof` checks elsewhere keep resolving to each application's own
 * error classes instead of one shared one.
 */
export async function unwrapSecret(
  stored: string,
  wrappingKey: CryptoKey | undefined,
  onPasswordRequired: () => never,
  onCorrupt: () => never,
): Promise<string> {
  if (!stored.startsWith(ENC_PREFIX)) return stored;
  if (!wrappingKey) onPasswordRequired();
  let ct: Uint8Array<ArrayBuffer>;
  try {
    ct = hexToBytes(stored.slice(ENC_PREFIX.length));
  } catch {
    onCorrupt();
  }
  try {
    return new TextDecoder().decode(await decryptData(wrappingKey, ct));
  } catch {
    throw new Error("Wrong password: failed to decrypt the stored secret.");
  }
}
