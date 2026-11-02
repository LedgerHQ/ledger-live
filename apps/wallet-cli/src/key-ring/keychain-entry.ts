import { Entry, type EntryOptions } from "@napi-rs/keyring";
import { createHash } from "node:crypto";
import { stateDir } from "@bunli/utils";
import { APP_NAME } from "../session/session-store";
import { errMessage } from "../shared/error-message";
import { encryptData, decryptData, hexToBytes } from "./crypto";
import { KeychainUnavailableError } from "./keychain-unavailable-error";

const SERVICE = APP_NAME;
const ENC_PREFIX = "ENC:";
// Only ever built, never read or written.
const PROBE_SERVICE = `${APP_NAME}-probe`;
// Without a pin, Linux `new Entry()` silently falls back to the kernel keyring, which loses the key
// on reboot. Pinned, the constructor throws when no Secret Service is reachable.
const SECRET_SERVICE_ONLY: EntryOptions = { linux: { store: "secret-service" } };

// The pinned constructor is the whole check: a read would also report errors (a timeout, a locked
// collection) that don't mean the Secret Service is missing.
function probeSecretService(): Entry {
  return new Entry(PROBE_SERVICE, "probe", SECRET_SERVICE_ONLY);
}

let probeKeychain: () => unknown = probeSecretService;

// Test seam — keeps tests off the OS keychain; `null` restores it.
export function _setTestKeychainProbe(probe: (() => unknown) | null): void {
  probeKeychain = probe ?? probeSecretService;
}

// Reports a missing Secret Service up front, with a hint, instead of failing on the first pinned
// entry. Not memoized: callers probe right before they read or write.
export function assertOsKeychainAvailable(hint: string): void {
  if (process.platform !== "linux") return;
  try {
    probeKeychain();
  } catch (e) {
    throw new KeychainUnavailableError(
      `No OS keychain is available: no Secret Service provider (e.g. gnome-keyring or KeePassXC) ` +
        `is reachable (${errMessage(e)}). ${hint}`,
      { cause: e },
    );
  }
}

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
  return osKeychainEntry(`${accountPrefix}-${digest}`);
}

// Throws on Linux when no Secret Service is reachable.
export function osKeychainEntry(account: string): Entry {
  return new Entry(SERVICE, account, SECRET_SERVICE_ONLY);
}

/**
 * "Deleted" (`true`) and "already absent" (`false` since @napi-rs/keyring 2.0) both satisfy the
 * postcondition (no key remains), so both collapse to `true`; only a throw (the key may still
 * persist, or the entry can't even be built) returns `false`.
 */
export function deleteKeychainEntry(entry: () => Entry): boolean {
  try {
    entry().deletePassword();
    return true;
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
 * keys use it here; `ring`'s keychain module is meant to adopt the same functions too, so neither
 * drifts onto a different wrap format.
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
