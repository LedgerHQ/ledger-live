import { selectBiometricsEnabled, type BiometricsAvailability } from "@features/platform-app-lock";
import { Switch } from "@ledgerhq/native-ui";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { track } from "~/analytics";
import SettingsRow from "~/components/SettingsRow";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { getBiometricsAvailability } from "../adapters/biometrics";
import { useBiometricsSetup } from "../hooks/useBiometricsSetup";

export function AppLockBiometricsRow(): React.JSX.Element | null {
  const { t } = useTranslation();
  const isEnabled = useSelector(selectBiometricsEnabled);
  const { enable, disable } = useBiometricsSetup();
  const [availability, setAvailability] = useState<BiometricsAvailability | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getBiometricsAvailability().then(next => {
      if (!cancelled) {
        setAvailability(next);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const biometricsName = useMemo(() => {
    if (availability?.status !== "available") {
      return "";
    }

    return t([`auth.enableBiometrics.${availability.kind.toLowerCase()}`, availability.kind]);
  }, [availability, t]);

  const onValueChange = useCallback(
    async (next: boolean) => {
      track("toggle_clicked", {
        toggle: "biometrics",
        page: ScreenName.GeneralSettings,
        enabled: next,
      });

      if (isPending) {
        return;
      }

      setIsPending(true);

      try {
        if (next) {
          await enable(t("appLock.biometrics.prompt", { biometricsType: biometricsName }));
        } else {
          await disable();
        }
      } finally {
        setIsPending(false);
      }
    },
    [biometricsName, disable, enable, isPending, t],
  );

  if (availability?.status !== "available") {
    return null;
  }

  return (
    <SettingsRow
      event="AppLockBiometricsRow"
      title={t("appLock.biometrics.title", { biometricsType: biometricsName })}
      desc={t("appLock.biometrics.desc", { biometricsType: biometricsName })}
    >
      <Switch checked={isEnabled} onChange={onValueChange} testID="biometrics-settings-switch" />
    </SettingsRow>
  );
}
