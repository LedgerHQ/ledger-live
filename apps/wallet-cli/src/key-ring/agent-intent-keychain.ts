import {
  keychainEntry,
  deleteKeychainEntry,
  hasKeychainEntry,
  wrapSecret,
  unwrapSecret,
} from "./keychain-entry";

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
  const payload = await wrapSecret(secretKeyHex, wrappingKey);
  getEntry(profileId).setPassword(payload);
}

// Not yet called anywhere in this package — NTTVS-746 (create/send intents) will load the secret
// key to sign with; NTTVS-749 (cancel) is the eventual caller for `deleteAgentIntentSecretKey` below.
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
  return unwrapSecret(
    stored.trim(),
    wrappingKey,
    () => {
      throw new AgentIntentPasswordRequiredError(
        `Agent Intent profile "${profileId}" is password-protected but no password was provided.`,
      );
    },
    () => {
      throw new AgentIntentCorruptKeychainError(
        `Corrupt keychain entry for Agent Intent profile "${profileId}": stored key is not valid hex.`,
      );
    },
  );
}

// "Deleted" and "already absent" both satisfy the postcondition (no key remains).
export const deleteAgentIntentSecretKey = (profileId: string): boolean =>
  deleteKeychainEntry(getEntry(profileId));

/** Whether a secret key is present in the OS keychain for this Agent Intent profile id. */
export const hasAgentIntentSecretKey = (profileId: string): boolean =>
  hasKeychainEntry(getEntry(profileId));
