/* @flow */
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { NavigatorName } from "../../../const";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import BiometricsRow from "./BiometricsRow";
import Switch from "../../../components/Switch";

export default function AuthSecurityToggle() {
  const privacy = useSelector(privacySelector);
  const { navigate } = useNavigation();

  function onValueChange(authSecurityEnabled: boolean): void {
    if (authSecurityEnabled) {
      navigate(NavigatorName.PasswordAddFlow);
    } else {
      navigate(NavigatorName.PasswordModifyFlow);
    }
  }

  return (
    <>
      <SettingsRow
        event="AuthSecurityToggle"
        title={<Trans i18nKey="settings.display.password" />}
        desc={<Trans i18nKey="settings.display.passwordDesc" />}
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
