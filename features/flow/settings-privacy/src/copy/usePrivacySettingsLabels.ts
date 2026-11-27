import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { PrivacyRowId } from "../logic/privacyRows";

type RowLabels = Readonly<{ title: string; description: string }>;

export type PrivacyLabels = Readonly<Record<PrivacyRowId, RowLabels>>;

/** The wording of the Privacy section. */
export function usePrivacySettingsLabels(): PrivacyLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      bugReports: {
        title: t("settings.privacy.bugReports.title"),
        description: t("settings.privacy.bugReports.description"),
      },
      appPerformance: {
        title: t("settings.privacy.appPerformance.title"),
        description: t("settings.privacy.appPerformance.description"),
      },
      personalizedExperience: {
        title: t("settings.privacy.personalizedExperience.title"),
        description: t("settings.privacy.personalizedExperience.description"),
      },
      analytics: {
        title: t("settings.privacy.analytics.title"),
        description: t("settings.privacy.analytics.description"),
      },
      privacyPolicy: {
        title: t("settings.privacy.privacyPolicy.title"),
        description: t("settings.privacy.privacyPolicy.description"),
      },
    }),
    [t],
  );
}
