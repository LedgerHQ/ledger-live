import {
  ACCESSIBLE,
  STORAGE_TYPE,
  getGenericPassword,
  resetGenericPassword,
  setGenericPassword,
  type SetOptions,
} from "react-native-keychain";
import { PKCE_ATTEMPT_KEY, parseAttempt, serializeAttempt } from "./internals/attemptPayload";
import type { PayCardStoredAttempt } from "./types";

/**
 * The library pairs a username with a password, and the attempt key has to go somewhere. `service`
 * is the only per-entry namespace it offers, so the key goes there and the username stays a
 * constant the store never reads back.
 */
const KEYCHAIN_USERNAME = "payCard";

/**
 * Native half of the PKCE store. The verifier is a bearer-grade secret for the length of one login,
 * so it goes to the keychain, not to redux. Both options match the session store: the redirect can
 * arrive while the screen is locked, and no read may wait for a biometric prompt.
 */
const writeOptions: SetOptions = {
  accessible: ACCESSIBLE.AFTER_FIRST_UNLOCK,
  storage: STORAGE_TYPE.AES_GCM_NO_AUTH,
};

export async function saveAttempt(attempt: PayCardStoredAttempt): Promise<void> {
  const stored = await setGenericPassword(KEYCHAIN_USERNAME, serializeAttempt(attempt), {
    ...writeOptions,
    service: PKCE_ATTEMPT_KEY,
  });
  // A refused write answers `false` instead of rejecting. The login must not start with an attempt
  // the redirect can never match.
  if (!stored) {
    throw new Error(`The keychain refused to store ${PKCE_ATTEMPT_KEY}`);
  }
}

export async function loadAttempt(): Promise<PayCardStoredAttempt | null> {
  try {
    const entry = await getGenericPassword({ service: PKCE_ATTEMPT_KEY });
    return parseAttempt(entry ? entry.password : null);
  } catch {
    // A value the OS can no longer decrypt reads as no attempt, which restarts the login.
    return null;
  }
}

export async function clearAttempt(): Promise<void> {
  await resetGenericPassword({ service: PKCE_ATTEMPT_KEY });
}
