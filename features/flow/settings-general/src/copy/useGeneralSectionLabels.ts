import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { SettingsTheme } from "@features/flow-settings";

type RowLabels = Readonly<{ title: string; description: string }>;

export type GeneralSectionLabels = Readonly<{
  ledgerSync: RowLabels & Readonly<{ manage: string; activate: string }>;
  theme: RowLabels & Readonly<{ options: Readonly<Record<SettingsTheme, string>> }>;
  language: RowLabels;
  currency: RowLabels;
  search: Readonly<{ placeholder: string; emptyLabel: string }>;
}>;

export function useGeneralSectionLabels(): GeneralSectionLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      ledgerSync: {
        title: t("settings.general.ledgerSync.title"),
        description: t("settings.general.ledgerSync.description"),
        manage: t("settings.general.ledgerSync.manage"),
        activate: t("settings.general.ledgerSync.activate"),
      },
      theme: {
        title: t("settings.general.theme.title"),
        description: t("settings.general.theme.description"),
        options: {
          system: t("settings.general.theme.options.system"),
          light: t("settings.general.theme.options.light"),
          dark: t("settings.general.theme.options.dark"),
        },
      },
      language: {
        title: t("settings.general.language.title"),
        description: t("settings.general.language.description"),
      },
      currency: {
        title: t("settings.general.currency.title"),
        description: t("settings.general.currency.description"),
      },
      search: {
        placeholder: t("settings.general.search.placeholder"),
        emptyLabel: t("settings.general.search.emptyLabel"),
      },
    }),
    [t],
  );
}
