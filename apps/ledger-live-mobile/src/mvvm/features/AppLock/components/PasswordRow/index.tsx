import { Switch } from "@ledgerhq/native-ui";
import React from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "~/context/Locale";
import useAppLockPasswordRowViewModel from "./useAppLockPasswordRowViewModel";

export function AppLockPasswordRow(): React.JSX.Element | null {
  const { t } = useTranslation();
  const { isHydrated, hasPassword, onValueChange } = useAppLockPasswordRowViewModel();

  if (!isHydrated) {
    return null;
  }

  return (
    <SettingsRow
      event="AuthSecurityToggle"
      title={t("settings.display.password")}
      desc={t("settings.display.passwordDesc")}
    >
      <Switch checked={hasPassword} onChange={onValueChange} testID="password-settings-switch" />
    </SettingsRow>
  );
}
