import { Entry } from "@napi-rs/keyring";
import { APP_NAME } from "../session/session-store";
import { pubkeyFromPrivatekey } from "./crypto";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";

const SERVICE = APP_NAME;

/**
 * When XDG_STATE_HOME is set (standard on Linux, also used by tests to point at a temp dir),
 * derive a unique account name per state directory so parallel workers don't clobber each other's keychain entries.
 */
function keychainAccount(): string {
  const xdg = process.env.XDG_STATE_HOME;
  if (xdg) {
    const suffix = xdg.replaceAll(/[^a-z0-9]/gi, "").slice(-12);
    return `member-private-key-${suffix}`;
  }
  return "member-private-key";
}

function getEntry() {
  return new Entry(SERVICE, keychainAccount());
}

/**
 * Save credentials to the OS keychain.
 * pubkey is stored on a second line when supplied, to avoid re-deriving it later
 * (the mock LKRP SDK uses non-hex private keys that cannot be used for secp256k1 derivation).
 */
export async function savePrivateKey(hex: string, pubkey?: string): Promise<void> {
  const entry = await getEntry();
  entry.setPassword(pubkey ? `${hex}\n${pubkey}` : hex);
}

export async function loadMemberCredentials(): Promise<MemberCredentials | null> {
  try {
    const stored = (await getEntry()).getPassword();
    if (!stored) return null;
    const lines = stored.trim().split("\n");
    const privatekey = lines[0];
    if (!privatekey) return null;
    const pubkey = lines[1] || pubkeyFromPrivatekey(privatekey);
    return { privatekey, pubkey };
  } catch {
    return null;
  }
}

export async function deletePrivateKey(): Promise<void> {
  try {
    (await getEntry()).deletePassword();
  } catch {}
}
