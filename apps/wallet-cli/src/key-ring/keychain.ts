import { pubkeyFromPrivatekey, encryptData, decryptData, hexToBytes } from "./crypto";
import { keychainEntry, deleteKeychainEntry, hasKeychainEntry, splitKeychainLines } from "./keychain-entry";
import type { MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";

const ENC_PREFIX = "ENC:";

/**
 * Thrown when the stored key is password-protected (`ENC:`) but no wrapping key was supplied, so
 * `ring destroy` can tell "cannot unlock" from "no credentials" and abort rather than local-wipe.
 */
export class PasswordRequiredError extends Error {}

/**
 * Thrown when the stored entry is structurally broken (non-hex payload, or a key that yields no
 * derivable pubkey) rather than merely locked by the wrong password. It can never authenticate the
 * remote, so `ring destroy` treats it as a local-wipe recovery instead of aborting to protect a ring
 * it could not tear down anyway.
 */
export class CorruptKeychainError extends Error {}

function getEntry() {
  return keychainEntry("member-private-key");
}

/**
 * Save credentials to the OS keychain. With a wrappingKey the private key is AES-256-GCM encrypted
 * and `ENC:`-prefixed so the entry is self-describing. pubkey is stored on a second line when given,
 * to avoid re-deriving it (the mock LKRP SDK uses non-hex keys that cannot be derived).
 */
export async function savePrivateKey(
  privatekey: string,
  pubkey?: string,
  wrappingKey?: CryptoKey,
): Promise<void> {
  let firstLine: string;
  if (wrappingKey) {
    const ct = await encryptData(wrappingKey, new TextEncoder().encode(privatekey));
    firstLine = `${ENC_PREFIX}${Buffer.from(ct).toString("hex")}`;
  } else {
    firstLine = privatekey;
  }
  const entry = getEntry();
  entry.setPassword(pubkey ? `${firstLine}\n${pubkey}` : firstLine);
}

export async function loadMemberCredentials(
  wrappingKey?: CryptoKey,
): Promise<MemberCredentials | null> {
  let stored: string | null;
  try {
    stored = getEntry().getPassword();
  } catch {
    return null;
  }
  if (!stored) return null;

  const lines = splitKeychainLines(stored);
  const firstLine = lines[0];
  if (!firstLine) return null;

  let privatekey: string;
  if (firstLine.startsWith(ENC_PREFIX)) {
    if (!wrappingKey)
      throw new PasswordRequiredError(
        "Private key is password-protected but no password provided.",
      );
    let ct: Uint8Array<ArrayBuffer>;
    try {
      ct = hexToBytes(firstLine.slice(ENC_PREFIX.length));
    } catch {
      // A non-hex payload is corruption, not a wrong password — don't send the user retrying passwords.
      throw new CorruptKeychainError(
        "Corrupt keychain entry: the stored key is not valid hex. " +
          "Run `wallet-cli ring destroy` then `wallet-cli ring init` to reset.",
      );
    }
    try {
      privatekey = new TextDecoder().decode(await decryptData(wrappingKey, ct));
    } catch {
      throw new Error("Wrong password: failed to decrypt private key.");
    }
  } else {
    privatekey = firstLine;
  }

  let pubkey = lines[1];
  if (!pubkey) {
    // No stored pubkey (legacy entry): derive it, guarding so a non-hex key gives an actionable
    // message instead of a cryptic hexToBytes throw.
    try {
      pubkey = pubkeyFromPrivatekey(privatekey);
    } catch {
      throw new CorruptKeychainError(
        "Corrupt keychain entry: no public key stored and the private key is not derivable. " +
          "Run `wallet-cli ring destroy` then `wallet-cli ring init` to reset.",
      );
    }
  }
  return { privatekey, pubkey };
}

// "Deleted" and "already absent" both satisfy the postcondition (no key remains); callers use a
// `false` result (a thrown backend error, key may persist) to keep the ring metadata so destroy
// can be re-run.
export const deletePrivateKey = (): boolean => deleteKeychainEntry(getEntry());

/** Whether a member private key is present in the OS keychain for this state dir. */
export const hasStoredKey = (): boolean => hasKeychainEntry(getEntry());
