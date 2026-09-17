import {
  createPasswordVerifier,
  matchesPasswordVerifier,
  type PasswordVerifier,
} from "@shared/password-verifier";
import {
  APP_LOCK_SCRYPT_PARAMS,
  derivePasswordDigest,
  serialiseDerivation,
} from "./internals/digest.native";
import {
  clearPasswordVerifier,
  hasStoredVerifier,
  readPasswordVerifier,
  writePasswordVerifier,
} from "./internals/store.native";

/** The app draws the randomness, so this package needs no source of its own. */
export const APP_LOCK_SALT_LENGTH = 16;

export type PasswordCheck =
  | Readonly<{ status: "correct"; verifier: PasswordVerifier }>
  | Readonly<{ status: "incorrect" }>
  | Readonly<{ status: "notSet" }>;

async function verify(password: string): Promise<PasswordCheck> {
  const verifier = await readPasswordVerifier();

  if (!verifier) {
    return { status: "notSet" } as const;
  }

  const digest = await derivePasswordDigest(password, verifier.salt, verifier.scrypt);

  return matchesPasswordVerifier(verifier, digest)
    ? ({ status: "correct", verifier } as const)
    : ({ status: "incorrect" } as const);
}

// One turn of the queue: two concurrent setups would otherwise swap their salts.
export function storeNewPassword(password: string, salt: Uint8Array): Promise<void> {
  return serialiseDerivation(async () => {
    const digest = await derivePasswordDigest(password, salt, APP_LOCK_SCRYPT_PARAMS);

    await writePasswordVerifier(
      createPasswordVerifier({ digest, salt, scrypt: APP_LOCK_SCRYPT_PARAMS }),
    );
  });
}

export function hasPasswordVerifier(): Promise<boolean> {
  return hasStoredVerifier();
}

export function checkPassword(password: string): Promise<PasswordCheck> {
  return serialiseDerivation(() => verify(password));
}

// One turn too: a setup landing between the check and the delete would lose its password.
export function clearPasswordIfCorrect(password: string): Promise<PasswordCheck> {
  return serialiseDerivation(async () => {
    const check = await verify(password);

    if (check.status === "correct") {
      await clearPasswordVerifier();
    }

    return check;
  });
}
