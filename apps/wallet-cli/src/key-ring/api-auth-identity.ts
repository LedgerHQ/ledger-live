import { Entry } from "@napi-rs/keyring";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { initMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { APP_NAME } from "../session/session-store";
import { walletCliDebug } from "../shared/log";
import { pubkeyFromPrivatekey } from "./crypto";
import { profileKeychainAccount } from "./keychain";

export type ApiAuthKeychain = {
  getPassword(account: string): string | null;
  setPassword(account: string, value: string): void;
};

const osKeychain: ApiAuthKeychain = {
  getPassword: account => new Entry(APP_NAME, account).getPassword(),
  setPassword: (account, value) => new Entry(APP_NAME, account).setPassword(value),
};

type ApiAuthIdentity = { trustchain: null; memberCredentials: MemberCredentials };

let keychain = osKeychain;
// Loaded once per run, so re-authenticating after a 401 signs with the same key, even a one-off one.
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

function getOrCreateApiAuthCredentials(account: string): MemberCredentials {
  let stored: string | null;
  try {
    stored = keychain.getPassword(account);
  } catch (error) {
    // No usable keychain (e.g. headless Linux without a secret service): a one-off key still
    // authenticates this run.
    walletCliDebug("api auth: OS keychain unavailable, using a one-off key", error);
    return initMemberCredentials();
  }

  const existing = stored ? parseCredentials(stored) : null;
  if (existing) return existing;

  const created = initMemberCredentials();
  try {
    keychain.setPassword(account, created.privatekey);
  } catch (error) {
    walletCliDebug("api auth: failed to store the key in the OS keychain", error);
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
