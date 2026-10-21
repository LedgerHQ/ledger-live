import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { initMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { walletCliDebug } from "../shared/log";
import { writeStderr } from "../shared/ui";
import { pubkeyFromPrivatekey } from "./crypto";
import { profileKeychainAccount } from "./keychain";
import { assertOsKeychainAvailable, osKeychainEntry } from "./keychain-entry";

export type ApiAuthKeychain = {
  getPassword(account: string): string | null;
  setPassword(account: string, value: string): void;
};

const osKeychain: ApiAuthKeychain = {
  getPassword: account => {
    // On Linux the entry is pinned to the Secret Service, so a missing one throws instead of the key
    // silently landing in the kernel keyring, which loses it on reboot.
    assertOsKeychainAvailable("The Ledger API auth key can't be kept.");
    return osKeychainEntry(account).getPassword();
  },
  setPassword: (account, value) => osKeychainEntry(account).setPassword(value),
};

type ApiAuthIdentity = { trustchain: null; memberCredentials: MemberCredentials | null };

let keychain = osKeychain;
// Loaded once per run, so re-authenticating after a 401 signs with the same key, and a missing
// keychain is probed and reported once.
let cachedIdentity: { account: string; identity: ApiAuthIdentity } | undefined;

/** @internal Test seam — keeps tests off the OS keychain and starts a new run; `null` restores it. */
export function _setTestApiAuthKeychain(k: ApiAuthKeychain | null): void {
  keychain = k ?? osKeychain;
  cachedIdentity = undefined;
}

export function apiAuthKeychainAccount(): string {
  return profileKeychainAccount("api-auth-key");
}

/**
 * Identity used to authenticate Ledger API calls: a per-profile key kept in the OS keychain, created
 * on first use. It is never the Key Ring member key and never carries a trustchain, so the backend
 * sees these tokens as unattested. Stored unencrypted, so it never prompts for the ring password.
 * Without a usable keychain, or when the new key can't be saved, it has no credentials and requests
 * go without a token.
 */
export function loadApiAuthIdentity(): ApiAuthIdentity {
  const account = apiAuthKeychainAccount();
  if (cachedIdentity?.account !== account) {
    cachedIdentity = {
      account,
      identity: { trustchain: null, memberCredentials: getOrCreateApiAuthCredentials(account) },
    };
  }
  return cachedIdentity.identity;
}

function getOrCreateApiAuthCredentials(account: string): MemberCredentials | null {
  let stored: string | null;
  try {
    stored = keychain.getPassword(account);
  } catch (error) {
    // No usable keychain (e.g. headless Linux without a secret service): a key that can't be kept
    // would rotate silently, so requests go without a token instead.
    walletCliDebug("api auth: OS keychain unavailable", error);
    writeStderr(
      "⚠ No usable OS keychain for the Ledger API auth key: " +
        "swap quotes are requested without authentication.\n",
    );
    return null;
  }

  const existing = stored ? parseCredentials(stored) : null;
  if (existing) return existing;

  const created = initMemberCredentials();
  try {
    keychain.setPassword(account, created.privatekey);
  } catch (error) {
    walletCliDebug("api auth: failed to store the key in the OS keychain", error);
    writeStderr(
      "⚠ Could not save the Ledger API auth key in the OS keychain: " +
        "swap quotes are requested without authentication.\n",
    );
    return null;
  }
  return created;
}

/** A corrupt entry yields `null` and is replaced: the key only identifies this profile to the API. */
function parseCredentials(stored: string): MemberCredentials | null {
  const privatekey = stored.trim();
  try {
    return { privatekey, pubkey: pubkeyFromPrivatekey(privatekey) };
  } catch {
    return null;
  }
}
