import { matchesPasswordVerifier, type PasswordVerifier } from "@shared/password-verifier";
import { derivePasswordDigest, serialiseDerivation } from "./passwordDigest";
import { readPasswordVerifier } from "./verifierStore";

export type PasswordCheck =
  | Readonly<{ status: "correct"; verifier: PasswordVerifier }>
  | Readonly<{ status: "incorrect" }>
  | Readonly<{ status: "notSet" }>;

export async function checkPasswordInline(password: string): Promise<PasswordCheck> {
  const verifier = await readPasswordVerifier();

  if (!verifier) {
    return { status: "notSet" };
  }

  const digest = await derivePasswordDigest(password, verifier.salt, verifier.scrypt);

  return matchesPasswordVerifier(verifier, digest)
    ? { status: "correct", verifier }
    : { status: "incorrect" };
}

export function checkPassword(password: string): Promise<PasswordCheck> {
  return serialiseDerivation(() => checkPasswordInline(password));
}
