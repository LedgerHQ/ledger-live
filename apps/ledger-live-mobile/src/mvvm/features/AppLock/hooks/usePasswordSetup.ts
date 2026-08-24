import { setHasPassword, setNeedsLongerPassword } from "@features/platform-app-lock";
import { createPasswordVerifier } from "@shared/password-verifier";
import { getRandomBytesAsync } from "expo-crypto";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import {
  APP_LOCK_SALT_LENGTH,
  APP_LOCK_SCRYPT_PARAMS,
  derivePasswordDigest,
  serialiseDerivation,
} from "../adapters/passwordDigest";
import { writeInstallMarker } from "../adapters/installMarker";
import { writePasswordVerifier } from "../adapters/verifierStore";

export type PasswordSetup = Readonly<{
  savePassword: (password: string) => Promise<void>;
}>;

export function usePasswordSetup(): PasswordSetup {
  const dispatch = useDispatch();

  const savePassword = useCallback(
    (password: string) =>
      serialiseDerivation(async () => {
        const salt = await getRandomBytesAsync(APP_LOCK_SALT_LENGTH);
        const digest = await derivePasswordDigest(password, salt, APP_LOCK_SCRYPT_PARAMS);
        const verifier = createPasswordVerifier({
          digest,
          salt,
          scrypt: APP_LOCK_SCRYPT_PARAMS,
        });

        await writePasswordVerifier(verifier);
        // Marks the protection as belonging to this install, so a reinstall does not inherit it.
        await writeInstallMarker();
        dispatch(setHasPassword(true));
        dispatch(setNeedsLongerPassword(false));
      }),
    [dispatch],
  );

  return { savePassword };
}
