import { Switch } from "@ledgerhq/native-ui";
import React from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "~/context/Locale";
import usePasswordRowViewModel from "./usePasswordRowViewModel";

export function AppLockPasswordRow(): React.JSX.Element {
  const { t } = useTranslation();
  const { hasPassword, onValueChange } = usePasswordRowViewModel();

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
