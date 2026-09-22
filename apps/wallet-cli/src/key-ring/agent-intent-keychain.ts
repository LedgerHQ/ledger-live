import { encryptData, decryptData, hexToBytes } from "./crypto";
import { keychainEntry, deleteKeychainEntry, hasKeychainEntry } from "./keychain-entry";

const ENC_PREFIX = "ENC:";

/**
 * Thrown when a stored Agent Intent secret key is password-protected (`ENC:`) but no wrapping key
 * was supplied. Mirrors `PasswordRequiredError` in `keychain.ts` for the ring member key.
 */
export class AgentIntentPasswordRequiredError extends Error {}

/**
 * Thrown when a stored Agent Intent entry is structurally broken (non-hex `ENC:` payload) rather
 * than merely locked by the wrong password.
 */
export class AgentIntentCorruptKeychainError extends Error {}

function getEntry(profileId: string) {
  return keychainEntry("agent-intent-key", "agent-intent", profileId);
}

/**
 * Save an Agent Intent profile's secret key to the OS keychain. With a wrappingKey the secret is
 * AES-256-GCM encrypted and `ENC:`-prefixed so the entry is self-describing, matching the ring
 * member key's storage convention in `keychain.ts`.
 */
export async function saveAgentIntentSecretKey(
  profileId: string,
  secretKeyHex: string,
  wrappingKey?: CryptoKey,
): Promise<void> {
  let payload: string;
  if (wrappingKey) {
    const ct = await encryptData(wrappingKey, new TextEncoder().encode(secretKeyHex));
    payload = `${ENC_PREFIX}${Buffer.from(ct).toString("hex")}`;
  } else {
    payload = secretKeyHex;
  }
  getEntry(profileId).setPassword(payload);
}

export async function loadAgentIntentSecretKey(
  profileId: string,
  wrappingKey?: CryptoKey,
): Promise<string | null> {
  let stored: string | null;
  try {
    stored = getEntry(profileId).getPassword();
  } catch {
    return null;
  }
  if (!stored) return null;

  // CRLF-tolerant trim: a keychain entry written on Windows may carry a trailing \r.
  const trimmed = stored.trim();
  if (!trimmed.startsWith(ENC_PREFIX)) return trimmed;

  if (!wrappingKey) {
    throw new AgentIntentPasswordRequiredError(
      `Agent Intent profile "${profileId}" is password-protected but no password was provided.`,
    );
  }
  let ct: Uint8Array<ArrayBuffer>;
  try {
    ct = hexToBytes(trimmed.slice(ENC_PREFIX.length));
  } catch {
    throw new AgentIntentCorruptKeychainError(
      `Corrupt keychain entry for Agent Intent profile "${profileId}": stored key is not valid hex.`,
    );
  }
  try {
    return new TextDecoder().decode(await decryptData(wrappingKey, ct));
  } catch {
    throw new Error(`Wrong password: failed to decrypt Agent Intent profile "${profileId}".`);
  }
}

// "Deleted" and "already absent" both satisfy the postcondition (no key remains).
export const deleteAgentIntentSecretKey = (profileId: string): boolean =>
  deleteKeychainEntry(getEntry(profileId));

/** Whether a secret key is present in the OS keychain for this Agent Intent profile id. */
export const hasAgentIntentSecretKey = (profileId: string): boolean =>
  hasKeychainEntry(getEntry(profileId));
