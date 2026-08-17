import { PasswordNotSet, setHasPassword } from "@features/platform-app-lock";
import { matchesPasswordVerifier } from "@shared/password-verifier";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import { derivePasswordDigest, serialiseDerivation } from "../adapters/passwordDigest";
import { clearPasswordVerifier, readPasswordVerifier } from "../adapters/verifierStore";

export type PasswordDeactivation = Readonly<{
  deactivatePassword: (password: string) => Promise<boolean>;
}>;

export function usePasswordDeactivation(): PasswordDeactivation {
  const dispatch = useDispatch();

  const deactivatePassword = useCallback(
    (password: string) =>
      serialiseDerivation(async () => {
        const verifier = await readPasswordVerifier();

        if (!verifier) {
          throw new PasswordNotSet();
        }

        const digest = await derivePasswordDigest(password, verifier.salt, verifier.scrypt);

        if (!matchesPasswordVerifier(verifier, digest)) {
          return false;
        }

        await clearPasswordVerifier();
        dispatch(setHasPassword(false));

        return true;
      }),
    [dispatch],
  );

  return { deactivatePassword };
}
