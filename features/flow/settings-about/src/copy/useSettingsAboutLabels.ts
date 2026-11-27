import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

export type SettingsAboutLabels = Readonly<{
  version: Readonly<{ title: string }>;
  terms: Readonly<{ title: string; description: string }>;
  feedback: Readonly<{ title: string }>;
  rate: Readonly<{ title: (storeName: string) => string }>;
  connect: Readonly<{
    title: string;
    x: string;
    instagram: string;
    github: string;
  }>;
}>;

export function useSettingsAboutLabels(): SettingsAboutLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      version: { title: t("settings.about.version.title") },
      terms: {
        title: t("settings.about.terms.title"),
        description: t("settings.about.terms.description"),
      },
      feedback: { title: t("settings.about.feedback.title") },
      rate: {
        title: (storeName: string) => t("settings.about.rate.title", { storeName }),
      },
      connect: {
        title: t("settings.about.connect.title"),
        x: t("settings.about.connect.x"),
        instagram: t("settings.about.connect.instagram"),
        github: t("settings.about.connect.github"),
      },
    }),
    [t],
  );
}
