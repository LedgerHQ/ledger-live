import { matchesPasswordVerifier } from "@shared/password-verifier";
import { isPasswordLongEnough } from "../../password";
import type { PasswordCheck } from "../types";
import { derivePasswordDigest } from "./digest.native";
import { readStoredPassword, writePasswordVerifier, type StoredPassword } from "./store.native";

// Unserialised on purpose: callers hold a turn of the derivation queue and this must not ask for a
// second one, which would wait on the turn it is already inside.
export async function verifyPassword(password: string): Promise<PasswordCheck> {
  const stored = await readStoredPassword();

  if (!stored) {
    return { status: "notSet" } as const;
  }

  const digest = await derivePasswordDigest(password, stored.verifier.salt, stored.verifier.scrypt);

  return matchesPasswordVerifier(stored.verifier, digest)
    ? ({
        status: "correct",
        verifier: stored.verifier,
        needsLongerPassword: await markFromPassword(stored, password),
      } as const)
    : ({ status: "incorrect" } as const);
}

async function markFromPassword(stored: StoredPassword, password: string): Promise<boolean> {
  const needsLongerPassword = !isPasswordLongEnough(password);

  if (needsLongerPassword !== stored.needsLongerPassword) {
    // A repair, not the proof: a keychain that will not take it must not cost an unlock already
    // earned, and the next password unlock asks again.
    await writePasswordVerifier({ verifier: stored.verifier, needsLongerPassword }).catch(
      () => undefined,
    );
  }

  return needsLongerPassword;
}
