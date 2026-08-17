import { selectHasPassword } from "@features/platform-app-lock";
import { Switch } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { track } from "~/analytics";
import SettingsRow from "~/components/SettingsRow";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";

export function AppLockPasswordRow(): React.JSX.Element {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const hasPassword = useSelector(selectHasPassword);

  const onValueChange = useCallback(
    (enabled: boolean) => {
      track("toggle_clicked", {
        toggle: "Password Lock",
        page: ScreenName.GeneralSettings,
        enabled,
      });

      navigate(enabled ? NavigatorName.PasswordAddFlow : NavigatorName.PasswordModifyFlow);
    },
    [navigate],
  );

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
