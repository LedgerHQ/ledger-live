import { createPasswordVerifier } from "@shared/password-verifier";
import {
  APP_LOCK_SCRYPT_PARAMS,
  derivePasswordDigest,
  serialiseDerivation,
} from "./internals/digest.native";
import {
  clearPasswordVerifier,
  hasStoredVerifier,
  writePasswordVerifier,
} from "./internals/store.native";
import { verifyPassword } from "./internals/verify.native";
import type { PasswordCheck } from "./types";

/** The app draws the randomness, so this package needs no source of its own. */
export const APP_LOCK_SALT_LENGTH = 16;

// One turn of the queue: two concurrent setups would otherwise swap their salts.
export function storeNewPassword(password: string, salt: Uint8Array): Promise<void> {
  return serialiseDerivation(async () => {
    const digest = await derivePasswordDigest(password, salt, APP_LOCK_SCRYPT_PARAMS);

    await writePasswordVerifier(
      createPasswordVerifier({ digest, salt, scrypt: APP_LOCK_SCRYPT_PARAMS }),
    );
  });
}

export function clearStoredPassword(): Promise<void> {
  return serialiseDerivation(() => clearPasswordVerifier());
}

export function hasPasswordVerifier(): Promise<boolean> {
  return hasStoredVerifier();
}

export function checkPassword(password: string): Promise<PasswordCheck> {
  return serialiseDerivation(() => verifyPassword(password));
}

// One turn too: a setup landing between the check and the delete would lose its password.
export function clearPasswordIfCorrect(password: string): Promise<PasswordCheck> {
  return serialiseDerivation(async () => {
    const check = await verifyPassword(password);

    if (check.status === "correct") {
      await clearPasswordVerifier();
    }

    return check;
  });
}
