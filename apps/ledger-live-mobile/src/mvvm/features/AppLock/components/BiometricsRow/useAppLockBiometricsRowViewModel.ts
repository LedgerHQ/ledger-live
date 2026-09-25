import { selectBiometricsEnabled, type BiometricsAvailability } from "@features/platform-app-lock";
import { useCallback, useRef } from "react";
import { track } from "@shared/analytics";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useBiometricsAvailability } from "../../hooks/useBiometricsAvailability";
import { useKeepProtection, type KeepProtection } from "../../hooks/useKeepProtection";
import { useBiometricsSetup } from "../../hooks/useBiometricsSetup";
import { useBiometricsTypeLabel } from "../../hooks/useBiometricsTypeLabel";

export type AppLockBiometricsRowViewModel = Readonly<{
  availability: BiometricsAvailability | undefined;
  isEnabled: boolean;
  biometricsName: string;
  onValueChange: (enabled: boolean) => void;
}> &
  Pick<KeepProtection, "isRefusing" | "onRefusalClose">;

function useAppLockBiometricsRowViewModel(): AppLockBiometricsRowViewModel {
  const { t } = useTranslation();
  const isEnabled = useSelector(selectBiometricsEnabled);
  const { enable, disable } = useBiometricsSetup();
  const availability = useBiometricsAvailability();
  const { isRefusing, onRefusalClose, allowRemoval } = useKeepProtection();
  const isPendingRef = useRef(false);

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
        enabled: isEnabled,
      });

      // The prompt takes as long as the user does, and a second tap meanwhile would race it. Claimed
      // before the session read too, which is its own wait.
      if (isPendingRef.current) {
        return;
      }

      isPendingRef.current = true;

      try {
        if (!enabled && !(await allowRemoval("biometrics"))) {
          return;
        }

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
        isPendingRef.current = false;
      }
    },
    [allowRemoval, biometricsName, disable, enable, isEnabled, promptLabels, t],
  );

  return { availability, isEnabled, biometricsName, onValueChange, isRefusing, onRefusalClose };
}

export default useAppLockBiometricsRowViewModel;
