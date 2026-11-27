import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type { SettingsDateFormat } from "../ports";

export type DateFormatLabels = Readonly<{
  title: string;
  description: string;
  sheetTitle: string;
  options: Readonly<Record<SettingsDateFormat, string>>;
}>;

/** Wording of the Date format row and sheet, on mobile only. */
export function useDateFormatLabels(): DateFormatLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      title: t("settings.general.dateFormat.title"),
      description: t("settings.general.dateFormat.description"),
      sheetTitle: t("settings.general.dateFormat.sheetTitle"),
      options: {
        default: t("settings.general.dateFormat.options.default"),
        "DD/MM/YYYY": t("settings.general.dateFormat.options.dayFirst"),
        "MM/DD/YYYY": t("settings.general.dateFormat.options.monthFirst"),
      },
    }),
    [t],
  );
}
