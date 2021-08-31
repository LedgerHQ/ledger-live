/* @flow */
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { NavigatorName } from "../../../const";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import BiometricsRow from "./BiometricsRow";
import Switch from "../../../components/Switch";

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
        alignedTop
      >
        <Switch
          style={{ opacity: 0.99 }}
          value={!!privacy}
          onValueChange={onValueChange}
        />
      </SettingsRow>
      {privacy ? <BiometricsRow /> : null}
    </>
  );
}
