import { Switch } from "@ledgerhq/native-ui";
import { AppLockBiometricsRow } from "LLM/features/AppLock/components/BiometricsRow";
import { AppLockPasswordRow } from "LLM/features/AppLock/components/PasswordRow";
import { useAppLockScheme } from "LLM/features/AppLock/hooks/useAppLockScheme";
import { useLegacyPasswordToggle } from "LLM/features/AppLock/hooks/useLegacyPasswordToggle";
import React from "react";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "~/context/Locale";
import BiometricsRow from "./BiometricsRow";

function LegacyAuthSecurityToggle() {
  const { t } = useTranslation();

  const { privacy, isOn, onValueChange } = useLegacyPasswordToggle();

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
      <Switch checked={isOn} onChange={onValueChange} testID="password-settings-switch" />
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
