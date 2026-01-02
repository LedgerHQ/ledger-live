import React, { useState, useCallback } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector } from "~/context/store";
import { useTranslation } from "react-i18next";
import { Switch } from "@ledgerhq/native-ui";
import { NavigatorName } from "~/const";
import { privacySelector } from "~/reducers/settings";
import SettingsRow from "~/components/SettingsRow";
import BiometricsRow from "./BiometricsRow";
import { ScreenName } from "~/const";
import { track } from "~/analytics";

export default function AuthSecurityToggle() {
  const { t } = useTranslation();

  const privacy = useSelector(privacySelector);
  const { navigate } = useNavigation();

  const [isToggleOn, setIsToggleOn] = useState(!!privacy?.hasPassword);

  useFocusEffect(
    useCallback(() => {
      setIsToggleOn(!!privacy?.hasPassword);
    }, [privacy?.hasPassword]),
  );

  const onValueChange = (authSecurityEnabled: boolean): void => {
    track("toggle_clicked", {
      toggle: "Password Lock",
      page: ScreenName.GeneralSettings,
      enabled: !privacy?.hasPassword,
    });

    setIsToggleOn(authSecurityEnabled);

    navigate(
      authSecurityEnabled ? NavigatorName.PasswordAddFlow : NavigatorName.PasswordModifyFlow,
    );
  };

  const getPasswordDesc = () =>
    privacy?.biometricsType
      ? t("settings.display.passwordDescBioCompat", { biometricsType: privacy.biometricsType })
      : t("settings.display.passwordDesc");

  return (
    <>
      <SettingsRow
        event="AuthSecurityToggle"
        title={t("settings.display.password")}
        desc={getPasswordDesc()}
      >
        <Switch checked={isToggleOn} onChange={onValueChange} testID="password-settings-switch" />
      </SettingsRow>
      <BiometricsRow />
    </>
  );
}
