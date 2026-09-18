import {
  getBiometricsAvailability,
  selectBiometricsEnabled,
  type BiometricsAvailability,
} from "@features/platform-app-lock";
import { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useBiometricsSetup } from "../../hooks/useBiometricsSetup";

export type AppLockBiometricsRowViewModel = Readonly<{
  availability: BiometricsAvailability | undefined;
  isEnabled: boolean;
  biometricsName: string;
  onValueChange: (enabled: boolean) => void;
}>;

function useAppLockBiometricsRowViewModel(): AppLockBiometricsRowViewModel {
  const { t } = useTranslation();
  const isEnabled = useSelector(selectBiometricsEnabled);
  const { enable, disable } = useBiometricsSetup();
  const [availability, setAvailability] = useState<BiometricsAvailability | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getBiometricsAvailability()
      // A rejection would otherwise leave this undefined for good, hiding the row with no trace.
      .catch(() => ({ status: "unavailable" }) as const)
      .then(next => {
        if (!cancelled) {
          setAvailability(next);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const biometricsName = useMemo(
    () =>
      availability?.status === "available"
        ? t([`auth.enableBiometrics.${availability.kind.toLowerCase()}`, availability.kind])
        : "",
    [availability, t],
  );

  const promptLabels = useCallback(
    (reason: string) => ({
      reason,
      fallback: t("appLock.biometrics.useDeviceCredential"),
      cancel: t("common.cancel"),
    }),
    [t],
  );

  const onValueChange = useCallback(
    async (enabled: boolean) => {
      track("toggle_clicked", {
        toggle: "biometrics",
        page: ScreenName.GeneralSettings,
        enabled,
      });

      // The prompt takes as long as the user does, and a second tap meanwhile would race it.
      if (isPending) {
        return;
      }

      setIsPending(true);

      try {
        if (enabled) {
          await enable(
            promptLabels(t("appLock.biometrics.prompt", { biometricsType: biometricsName })),
          );
        } else {
          await disable(
            promptLabels(t("appLock.biometrics.disablePrompt", { biometricsType: biometricsName })),
          );
        }
      } finally {
        setIsPending(false);
      }
    },
    [biometricsName, disable, enable, isPending, promptLabels, t],
  );

  return { availability, isEnabled, biometricsName, onValueChange };
}

export default useAppLockBiometricsRowViewModel;
