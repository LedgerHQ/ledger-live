import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import { NavigatorName } from "../../../const";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import BiometricsRow from "./BiometricsRow";
import { ScreenName } from "../../../const";
import { track } from "../../../analytics";

/** COMPONENT */
export default function AuthSecurityToggle() {
  /** CONSTANTS */
  const { t } = useTranslation();

  const privacy = useSelector(privacySelector);
  const { navigate } = useNavigation();

  /** CALLBACKS */

  const onValueChange = (authSecurityEnabled: boolean): void => {
    // Add onClick Analytics
    track("toggle_clicked", {
      toggle: "Password Lock", // Moyen de chopper la key non traduite ?
      page: ScreenName.GeneralSettings,
      enabled: !privacy?.hasPassword,
    });

    navigate(
      authSecurityEnabled ? NavigatorName.PasswordAddFlow : NavigatorName.PasswordModifyFlow,
    );
  };
  /** RENDER */

  return (
    <>
      <SettingsRow
        event="AuthSecurityToggle"
        title={t("settings.display.password")}
        desc={t("settings.display.passwordDesc")}
      >
        <Switch
          checked={!!privacy?.hasPassword}
          onChange={onValueChange}
          testID="password-settings-switch"
        />
      </SettingsRow>
      <BiometricsRow />
    </>
  );
}
