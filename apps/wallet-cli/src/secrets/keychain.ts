import { Entry } from "@napi-rs/keyring";
import { APP_NAME } from "../session/session-store";
import { pubkeyFromPrivatekey, encryptData, decryptData, hexToBytes } from "./crypto";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";

const SERVICE = APP_NAME;
const ENC_PREFIX = "ENC:";

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
 * If wrappingKey is provided the private key hex is AES-256-GCM encrypted and prefixed with
 * "ENC:" so the entry is self-describing regardless of session state.
 * pubkey is stored on a second line when supplied, to avoid re-deriving it later
 * (the mock LKRP SDK uses non-hex private keys that cannot be used for secp256k1 derivation).
 */
export async function savePrivateKey(
  hex: string,
  pubkey?: string,
  wrappingKey?: CryptoKey,
): Promise<void> {
  let firstLine: string;
  if (wrappingKey) {
    const ct = await encryptData(wrappingKey, new TextEncoder().encode(hex));
    firstLine = `${ENC_PREFIX}${Buffer.from(ct).toString("hex")}`;
  } else {
    firstLine = hex;
  }
  const entry = await getEntry();
  entry.setPassword(pubkey ? `${firstLine}\n${pubkey}` : firstLine);
}

export async function loadMemberCredentials(
  wrappingKey?: CryptoKey,
): Promise<MemberCredentials | null> {
  let stored: string | null;
  try {
    stored = (await getEntry()).getPassword();
  } catch {
    return null;
  }
  if (!stored) return null;

  const lines = stored.trim().split("\n");
  const firstLine = lines[0];
  if (!firstLine) return null;

  let privatekey: string;
  if (firstLine.startsWith(ENC_PREFIX)) {
    if (!wrappingKey) throw new Error("Private key is password-protected but no password provided.");
    const ct = hexToBytes(firstLine.slice(ENC_PREFIX.length));
    try {
      privatekey = new TextDecoder().decode(await decryptData(wrappingKey, ct));
    } catch {
      throw new Error("Wrong password: failed to decrypt private key.");
    }
  } else {
    privatekey = firstLine;
  }

  const pubkey = lines[1] || pubkeyFromPrivatekey(privatekey);
  return { privatekey, pubkey };
}

export async function deletePrivateKey(): Promise<void> {
  try {
    (await getEntry()).deletePassword();
  } catch {}
}
