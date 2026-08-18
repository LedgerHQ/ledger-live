import { isPasswordLongEnough } from "@features/platform-app-lock";
import { createPasswordVerifier } from "@shared/password-verifier";
import { getRandomBytesAsync } from "expo-crypto";
import {
  APP_LOCK_SALT_LENGTH,
  APP_LOCK_SCRYPT_PARAMS,
  derivePasswordDigest,
  serialiseDerivation,
} from "./passwordDigest";
import { clearLegacyPassword, readLegacyPassword } from "./legacyPassword";
import { checkPasswordInline } from "./passwordVerification";
import { hasPasswordVerifier, writePasswordVerifier } from "./verifierStore";

export type MigrationResult =
  | Readonly<{ status: "notNeeded" }>
  | Readonly<{ status: "migrated"; needsLongerPassword: boolean }>
  | Readonly<{ status: "deferred" }>;

export function migrateLegacyPassword(): Promise<MigrationResult> {
  return serialiseDerivation(async () => {
    const legacyPassword = await readLegacyPassword();

    if (legacyPassword === null) {
      return { status: "notNeeded" } as const;
    }

    const needsLongerPassword = !isPasswordLongEnough(legacyPassword);

    if (!(await hasPasswordVerifier())) {
      const salt = await getRandomBytesAsync(APP_LOCK_SALT_LENGTH);
      const digest = await derivePasswordDigest(legacyPassword, salt, APP_LOCK_SCRYPT_PARAMS);

      await writePasswordVerifier(
        createPasswordVerifier({ digest, salt, scrypt: APP_LOCK_SCRYPT_PARAMS }),
        { needsLongerPassword },
      );
    }

    if ((await checkPasswordInline(legacyPassword)).status !== "correct") {
      return { status: "deferred" } as const;
    }

    await clearLegacyPassword();

    return { status: "migrated", needsLongerPassword } as const;
  });
}
