import { PasswordNotSet, setHasPassword } from "@features/platform-app-lock";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import { checkPassword } from "../adapters/passwordVerification";
import { clearPasswordVerifier } from "../adapters/verifierStore";

export type PasswordDeactivation = Readonly<{
  deactivatePassword: (password: string) => Promise<boolean>;
}>;

export function usePasswordDeactivation(): PasswordDeactivation {
  const dispatch = useDispatch();

  const deactivatePassword = useCallback(
    async (password: string) => {
      const check = await checkPassword(password);

      if (check.status === "notSet") {
        throw new PasswordNotSet();
      }

      if (check.status === "incorrect") {
        return false;
      }

      await clearPasswordVerifier();
      dispatch(setHasPassword(false));

      return true;
    },
    [dispatch],
  );

  return { deactivatePassword };
}
