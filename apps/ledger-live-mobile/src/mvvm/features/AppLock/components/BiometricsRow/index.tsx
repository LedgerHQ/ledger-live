import { Switch } from "@ledgerhq/native-ui";
import React from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "~/context/Locale";
import useAppLockBiometricsRowViewModel from "./useAppLockBiometricsRowViewModel";

export function AppLockBiometricsRow(): React.JSX.Element | null {
  const { t } = useTranslation();
  const { availability, isEnabled, biometricsName, onValueChange } =
    useAppLockBiometricsRowViewModel();

  // Hidden rather than disabled where there are none: nothing the user could act on from here.
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
