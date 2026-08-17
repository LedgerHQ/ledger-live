import {
  clearPasswordIfCorrect,
  PasswordNotSet,
  setHasPassword,
} from "@features/platform-app-lock";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";

export type PasswordDeactivation = Readonly<{
  deactivatePassword: (password: string) => Promise<boolean>;
}>;

export function usePasswordDeactivation(): PasswordDeactivation {
  const dispatch = useDispatch();

  const deactivatePassword = useCallback(
    async (password: string) => {
      const check = await clearPasswordIfCorrect(password);

      if (check.status === "notSet") {
        throw new PasswordNotSet();
      }

      if (check.status === "incorrect") {
        return false;
      }

      dispatch(setHasPassword(false));

      return true;
    },
    [dispatch],
  );

  return { deactivatePassword };
}
