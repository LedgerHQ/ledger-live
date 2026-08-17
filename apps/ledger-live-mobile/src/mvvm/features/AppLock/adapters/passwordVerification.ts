import { matchesPasswordVerifier, type PasswordVerifier } from "@shared/password-verifier";
import { derivePasswordDigest, serialiseDerivation } from "./passwordDigest";
import { readPasswordVerifier } from "./verifierStore";

export type PasswordCheck =
  | Readonly<{ status: "correct"; verifier: PasswordVerifier }>
  | Readonly<{ status: "incorrect" }>
  | Readonly<{ status: "notSet" }>;

export function checkPassword(password: string): Promise<PasswordCheck> {
  return serialiseDerivation(async () => {
    const verifier = await readPasswordVerifier();

    if (!verifier) {
      return { status: "notSet" } as const;
    }

    const digest = await derivePasswordDigest(password, verifier.salt, verifier.scrypt);

    return matchesPasswordVerifier(verifier, digest)
      ? ({ status: "correct", verifier } as const)
      : ({ status: "incorrect" } as const);
  });
}
