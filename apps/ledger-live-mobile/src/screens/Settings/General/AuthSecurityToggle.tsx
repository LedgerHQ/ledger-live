import { Switch } from "@ledgerhq/native-ui";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { AppLockBiometricsRow } from "LLM/features/AppLock/components/BiometricsRow";
import { AppLockPasswordRow } from "LLM/features/AppLock/components/PasswordRow";
import { useAppLockScheme } from "LLM/features/AppLock/hooks/useAppLockScheme";
import React, { useCallback, useState } from "react";
import { track } from "~/analytics";
import SettingsRow from "~/components/SettingsRow";
import { NavigatorName, ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { privacySelector } from "~/reducers/settings";
import BiometricsRow from "./BiometricsRow";

function LegacyAuthSecurityToggle() {
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
    <SettingsRow
      event="AuthSecurityToggle"
      title={t("settings.display.password")}
      desc={getPasswordDesc()}
    >
      <Switch checked={isToggleOn} onChange={onValueChange} testID="password-settings-switch" />
    </SettingsRow>
  );
}

export default function AuthSecurityToggle() {
  const scheme = useAppLockScheme();

  if (scheme === undefined) {
    return null;
  }

  // Both rows move together: the legacy biometrics row is disabled until a password exists.
  return scheme === "revamped" ? (
    <>
      <AppLockPasswordRow />
      <AppLockBiometricsRow />
    </>
  ) : (
    <>
      <LegacyAuthSecurityToggle />
      <BiometricsRow />
    </>
  );
}
