import { unlockApp } from "@features/platform-app-lock";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { promptBiometrics } from "../adapters/biometrics";

export type BiometricUnlock = Readonly<{
  runBiometricUnlock: () => Promise<boolean>;
}>;

export function useBiometricUnlock(): BiometricUnlock {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const runBiometricUnlock = useCallback(async () => {
    const result = await promptBiometrics(t("appLock.unlock.biometricsPrompt"));

    if (result.status !== "succeeded") {
      return false;
    }

    dispatch(unlockApp());
    return true;
  }, [dispatch, t]);

  return { runBiometricUnlock };
}
