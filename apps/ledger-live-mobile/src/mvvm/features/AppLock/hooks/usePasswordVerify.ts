import { matchesPasswordVerifier } from "@shared/password-verifier";
import { useCallback } from "react";
import { derivePasswordDigest, serialiseDerivation } from "../adapters/passwordDigest";
import { readPasswordVerifier } from "../adapters/verifierStore";

export function usePasswordVerify(): (password: string) => Promise<boolean> {
  return useCallback(
    (password: string) =>
      serialiseDerivation(async () => {
        const verifier = await readPasswordVerifier();
        if (!verifier) {
          return false;
        }

        const digest = await derivePasswordDigest(password, verifier.salt, verifier.scrypt);
        return matchesPasswordVerifier(verifier, digest);
      }),
    [],
  );
}
