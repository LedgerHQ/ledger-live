import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { SettingsHomeSectionId } from "../logic/settingsHomeSections";

export type SettingsLabels = Readonly<{
  title: string;
  sections: Readonly<Record<SettingsHomeSectionId, string>>;
}>;

export function useSettingsLabels(): SettingsLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      title: t("settings.title"),
      sections: {
        general: t("settings.sections.general"),
        assetManagement: t("settings.sections.assetManagement"),
        security: t("settings.sections.security"),
        notifications: t("settings.sections.notifications"),
        privacy: t("settings.sections.privacy"),
        about: t("settings.sections.about"),
      },
    }),
    [t],
  );
}
