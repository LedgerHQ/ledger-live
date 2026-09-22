import { matchesPasswordVerifier } from "@shared/password-verifier";
import type { PasswordCheck } from "../types";
import { derivePasswordDigest } from "./digest.native";
import { readPasswordVerifier } from "./store.native";

// Unserialised on purpose: callers hold a turn of the derivation queue and this must not ask for a
// second one, which would wait on the turn it is already inside.
export async function verifyPassword(password: string): Promise<PasswordCheck> {
  const verifier = await readPasswordVerifier();

  if (!verifier) {
    return { status: "notSet" } as const;
  }

  const digest = await derivePasswordDigest(password, verifier.salt, verifier.scrypt);

  return matchesPasswordVerifier(verifier, digest)
    ? ({ status: "correct", verifier } as const)
    : ({ status: "incorrect" } as const);
}
