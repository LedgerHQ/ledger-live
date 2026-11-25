import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { AUTO_LOCK_OPTIONS } from "../logic/autoLock";
import type { BiometricKind } from "../types";

type RowLabels = Readonly<{ title: string; description: string }>;

export type SecurityLabels = Readonly<{
  hideBalance: RowLabels;
  appLock: RowLabels;
  changePassword: RowLabels & Readonly<{ action: string }>;
  autoLock: RowLabels &
    Readonly<{ options: readonly Readonly<{ value: string; label: string }>[] }>;
  biometrics: RowLabels;
  mevProtection: RowLabels & Readonly<{ learnMore: string }>;
}>;

/** The wording of the Security section. Biometrics are named after what the device offers. */
export function useSecuritySettingsLabels(biometricKind: BiometricKind | null): SecurityLabels {
  const { t } = useTranslation();

  return useMemo(() => {
    const biometric = biometricKind ? t(`settings.security.biometrics.kind.${biometricKind}`) : "";
    return {
      hideBalance: {
        title: t("settings.security.hideBalance.title"),
        description: t("settings.security.hideBalance.description"),
      },
      appLock: {
        title: t("settings.security.appLock.title"),
        description: t("settings.security.appLock.description"),
      },
      changePassword: {
        title: t("settings.security.changePassword.title"),
        description: t("settings.security.changePassword.description"),
        action: t("settings.security.changePassword.action"),
      },
      autoLock: {
        title: t("settings.security.autoLock.title"),
        description: t("settings.security.autoLock.description"),
        options: AUTO_LOCK_OPTIONS.map(option => ({
          value: String(option.value),
          label: t(`settings.security.autoLock.options.${option.id}`),
        })),
      },
      biometrics: {
        title: biometric,
        description: t("settings.security.biometrics.description", { biometric }),
      },
      mevProtection: {
        title: t("settings.security.mevProtection.title"),
        description: t("settings.security.mevProtection.description"),
        learnMore: t("settings.security.mevProtection.learnMore"),
      },
    };
  }, [t, biometricKind]);
}
