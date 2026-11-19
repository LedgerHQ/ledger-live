import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { SettingsSectionId } from "../logic/settingsSections";

export type SettingsLabels = Readonly<{
  title: string;
  sections: Readonly<Record<SettingsSectionId, string>>;
}>;

export function useSettingsLabels(): SettingsLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      title: t("newSettings.title"),
      sections: {
        general: t("newSettings.sections.general"),
        assetManagement: t("newSettings.sections.assetManagement"),
        security: t("newSettings.sections.security"),
        privacy: t("newSettings.sections.privacy"),
        about: t("newSettings.sections.about"),
      },
    }),
    [t],
  );
}
