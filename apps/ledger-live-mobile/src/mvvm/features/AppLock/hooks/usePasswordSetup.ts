import {
  APP_LOCK_SALT_LENGTH,
  setHasPassword,
  storeNewPassword,
} from "@features/platform-app-lock";
import { getRandomBytesAsync } from "expo-crypto";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";

export type PasswordSetup = Readonly<{
  savePassword: (password: string) => Promise<void>;
}>;

export function usePasswordSetup(): PasswordSetup {
  const dispatch = useDispatch();

  const savePassword = useCallback(
    async (password: string) => {
      await storeNewPassword(password, await getRandomBytesAsync(APP_LOCK_SALT_LENGTH));
      dispatch(setHasPassword(true));
    },
    [dispatch],
  );

  return { savePassword };
}
