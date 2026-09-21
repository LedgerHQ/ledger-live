import { KeepProtectionSheet } from "@features/flow-app-lock";
import { Switch } from "@ledgerhq/native-ui";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SettingsRow from "~/components/SettingsRow";
import { useTranslation } from "~/context/Locale";
import useAppLockPasswordRowViewModel from "./useAppLockPasswordRowViewModel";

export function AppLockPasswordRow(): React.JSX.Element | null {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isHydrated, hasPassword, onValueChange, isRefusing, onRefusalClose } =
    useAppLockPasswordRowViewModel();

  if (!isHydrated) {
    return null;
  }

  return (
    <>
      <SettingsRow
        event="AuthSecurityToggle"
        title={t("settings.display.password")}
        desc={t("settings.display.passwordDesc")}
      >
        <Switch checked={hasPassword} onChange={onValueChange} testID="password-settings-switch" />
      </SettingsRow>

      <KeepProtectionSheet
        isOpen={isRefusing}
        protection="password"
        bottomInset={bottomInset}
        onClose={onRefusalClose}
      />
    </>
  );
}
