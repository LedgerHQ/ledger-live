import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import { NavigatorName } from "../../../const";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import BiometricsRow from "./BiometricsRow";

export default function AuthSecurityToggle() {
  const { t } = useTranslation();

  const privacy = useSelector(privacySelector);
  const { navigate } = useNavigation();

  const onValueChange = (authSecurityEnabled: boolean): void =>
    navigate(
      authSecurityEnabled
        ? NavigatorName.PasswordAddFlow
        : NavigatorName.PasswordModifyFlow,
    );

  return (
    <>
      <SettingsRow
        event="AuthSecurityToggle"
        title={t("settings.display.password")}
        desc={t("settings.display.passwordDesc")}
      >
        <Switch
          checked={!!privacy}
          onChange={onValueChange}
          testID="password-settings-switch"
        />
      </SettingsRow>
      {privacy ? <BiometricsRow /> : null}
    </>
  );
}
