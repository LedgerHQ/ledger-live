import { selectBiometricsEnabled, type BiometricsAvailability } from "@features/platform-app-lock";
import { useCallback, useState } from "react";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useBiometricsAvailability } from "../../hooks/useBiometricsAvailability";
import { useBiometricsSetup } from "../../hooks/useBiometricsSetup";
import { useBiometricsTypeLabel } from "../../hooks/useBiometricsTypeLabel";

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
  const availability = useBiometricsAvailability();
  const [isPending, setIsPending] = useState(false);

  const biometricsName = useBiometricsTypeLabel(
    availability?.status === "available" ? availability.kind : undefined,
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
