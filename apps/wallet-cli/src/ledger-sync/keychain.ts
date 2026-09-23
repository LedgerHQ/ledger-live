import type { Entry } from "@napi-rs/keyring";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  keychainEntry,
  deleteKeychainEntry,
  hasKeychainEntry,
  splitKeychainLines,
} from "../key-ring/keychain-entry";

// Ledger Sync's own OS-keychain entry. Deliberately a distinct account namespace from
// `key-ring/keychain.ts` (the `ring` application's member key) and from
// `key-ring/agent-intent-keychain.ts` (Agent Intent profile keys) — the three are separate LKRP
// applications / trust models and must never share, overwrite, or be torn down by each other's
// destroy/reset flow.

/**
 * Thrown when the stored entry is structurally broken (not "privatekey\npubkey") rather than
 * merely missing. Mirrors `CorruptKeychainError` in `key-ring/keychain.ts`.
 */
export class LedgerSyncCorruptKeychainError extends Error {}

/** The subset of `@napi-rs/keyring`'s `Entry` these helpers use — lets tests pass a fake. */
export type LedgerSyncKeychainEntry = Pick<Entry, "getPassword" | "setPassword">;

function getEntry(): Entry {
  return keychainEntry("ledger-sync-member-key", "ledger-sync");
}

/** Save Ledger Sync's member credentials to the OS keychain. No password wrapping: unlike `ring`,
 * Ledger Sync has no app-level password layer — the OS keychain is the only protection, same
 * baseline as `key-ring/agent-intent-keychain.ts`. */
export function saveLedgerSyncMemberCredentials(
  creds: MemberCredentials,
  entry: LedgerSyncKeychainEntry = getEntry(),
): void {
  entry.setPassword(`${creds.privatekey}\n${creds.pubkey}`);
}

export function loadLedgerSyncMemberCredentials(
  entry: LedgerSyncKeychainEntry = getEntry(),
): MemberCredentials | null {
  let stored: string | null;
  try {
    stored = entry.getPassword();
  } catch {
    return null;
  }
  if (!stored) return null;

  const [privatekey, pubkey] = splitKeychainLines(stored);
  if (!privatekey || !pubkey) {
    throw new LedgerSyncCorruptKeychainError(
      'Corrupt Ledger Sync keychain entry: expected "privatekey\\npubkey". ' +
        "Run `wallet-cli ledger-sync destroy` then `wallet-cli ledger-sync enroll` to reset.",
    );
  }
  return { privatekey, pubkey };
}

// "Deleted" and "already absent" both satisfy the postcondition (no key remains).
export const deleteLedgerSyncMemberCredentials = (): boolean => deleteKeychainEntry(getEntry());

export const hasLedgerSyncMemberCredentials = (): boolean => hasKeychainEntry(getEntry());
