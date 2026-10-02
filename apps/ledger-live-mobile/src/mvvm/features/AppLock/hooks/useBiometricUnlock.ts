import { promptBiometrics, unlockApp } from "@features/platform-app-lock";
import { useCallback } from "react";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";

export type BiometricUnlock = Readonly<{
  runBiometricUnlock: () => Promise<boolean>;
}>;

export function useBiometricUnlock(): BiometricUnlock {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const runBiometricUnlock = useCallback(async () => {
    const result = await promptBiometrics({
      reason: t("appLock.unlock.biometricsPrompt"),
      fallback: t("appLock.biometrics.useDeviceCredential"),
      cancel: t("common.cancel"),
    });

    if (result.status !== "succeeded") {
      return false;
    }

    dispatch(unlockApp());
    return true;
  }, [dispatch, t]);

  return { runBiometricUnlock };
}
