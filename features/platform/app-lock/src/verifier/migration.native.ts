import { createPasswordVerifier } from "@shared/password-verifier";
import { isPasswordLongEnough } from "../password";
import {
  APP_LOCK_SCRYPT_PARAMS,
  derivePasswordDigest,
  serialiseDerivation,
} from "./internals/digest.native";
import { clearLegacyPassword, readLegacyPassword } from "./internals/legacyPassword.native";
import { hasStoredVerifier, writePasswordVerifier } from "./internals/store.native";
import { verifyPassword } from "./internals/verify.native";
import type { MigrationResult } from "./types";

/**
 * Moves a plaintext legacy password to a verifier. Write, prove, only then delete: a crash at any
 * point leaves the user a way in, through the legacy entry before the delete and through the
 * verifier after it. Never through neither.
 *
 * Resumable by construction — a verifier already present means an earlier run got that far, so this
 * one proves it and finishes the job instead of deriving a second time.
 *
 * The salt and the platform come from the caller, as the randomness and the app state do
 * elsewhere in this package.
 */
export function migrateLegacyPassword(
  salt: Uint8Array,
  platform: string,
): Promise<MigrationResult> {
  // One turn of the queue for the whole sequence, and `verifyPassword` rather than `checkPassword`:
  // asking for a second turn from inside this one would wait on a turn that cannot finish.
  return serialiseDerivation(async () => {
    const legacyPassword = await readLegacyPassword(platform);

    if (legacyPassword === null) {
      return { status: "notNeeded" } as const;
    }

    if (!(await hasStoredVerifier())) {
      const digest = await derivePasswordDigest(legacyPassword, salt, APP_LOCK_SCRYPT_PARAMS);

      await writePasswordVerifier(
        createPasswordVerifier({ digest, salt, scrypt: APP_LOCK_SCRYPT_PARAMS }),
      );
    }

    // Proven against what was actually stored, not against what we just computed: a verifier that
    // cannot open with this password must not cost the user their only way in.
    if ((await verifyPassword(legacyPassword)).status !== "correct") {
      return { status: "deferred" } as const;
    }

    await clearLegacyPassword();

    return {
      status: "migrated",
      needsLongerPassword: !isPasswordLongEnough(legacyPassword),
    } as const;
  });
}
