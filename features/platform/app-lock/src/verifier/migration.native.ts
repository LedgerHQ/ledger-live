import { createPasswordVerifier } from "@shared/password-verifier";
import { isPasswordLongEnough } from "../password";
import {
  APP_LOCK_SCRYPT_PARAMS,
  derivePasswordDigest,
  serialiseDerivation,
} from "./internals/digest.native";
import {
  clearLegacyPassword,
  hasLegacyPassword,
  readLegacyPassword,
} from "./internals/legacyPassword.native";
import { hasStoredVerifier, writePasswordVerifier } from "./internals/store.native";
import { verifyPassword } from "./internals/verify.native";
import type { MigrationResult } from "./types";

export function migrateLegacyPassword(
  salt: Uint8Array,
  platform: string,
): Promise<MigrationResult> {
  return serialiseDerivation(async () => {
    const legacyPassword = await readLegacyPassword(platform);

    if (legacyPassword === null) {
      return { status: "notNeeded" } as const;
    }

    const migrated = {
      status: "migrated",
      needsLongerPassword: !isPasswordLongEnough(legacyPassword),
    } as const;

    if (await hasStoredVerifier()) {
      if ((await verifyPassword(legacyPassword)).status === "correct") {
        return (await clearLegacyPassword()) ? migrated : ({ status: "deferred" } as const);
      }
    }

    const digest = await derivePasswordDigest(legacyPassword, salt, APP_LOCK_SCRYPT_PARAMS);

    await writePasswordVerifier(
      createPasswordVerifier({ digest, salt, scrypt: APP_LOCK_SCRYPT_PARAMS }),
    );

    if ((await verifyPassword(legacyPassword)).status !== "correct") {
      return { status: "deferred" } as const;
    }

    return (await clearLegacyPassword()) ? migrated : ({ status: "deferred" } as const);
  });
}

export async function isLegacyMigrationComplete(): Promise<boolean> {
  return (await hasStoredVerifier()) && !(await hasLegacyPassword());
}
