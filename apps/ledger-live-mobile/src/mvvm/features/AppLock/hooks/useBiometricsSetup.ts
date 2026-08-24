import { setBiometricsEnabled } from "@features/platform-app-lock";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import {
  armBiometricPrompt,
  disarmBiometricPrompt,
  promptBiometrics,
} from "../adapters/biometrics";
import { writeInstallMarker } from "../adapters/installMarker";

export type BiometricsSetup = Readonly<{
  enable: (reason: string) => Promise<boolean>;
  disable: () => Promise<void>;
}>;

export function useBiometricsSetup(): BiometricsSetup {
  const dispatch = useDispatch();

  const enable = useCallback(
    async (reason: string) => {
      // Before anything is recorded: recording first advertises an unlock the user has not proven.
      if ((await promptBiometrics(reason)).status !== "succeeded") {
        return false;
      }

      if (!(await armBiometricPrompt())) {
        return false;
      }

      // Marks the protection as belonging to this install, so a reinstall does not inherit it.
      await writeInstallMarker();
      dispatch(setBiometricsEnabled(true));
      return true;
    },
    [dispatch],
  );

  const disable = useCallback(async () => {
    await disarmBiometricPrompt();
    dispatch(setBiometricsEnabled(false));
  }, [dispatch]);

  return { enable, disable };
}
