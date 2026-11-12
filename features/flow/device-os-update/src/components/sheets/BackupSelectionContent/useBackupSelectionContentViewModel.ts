import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";

function formatTimeWithoutSpaceBeforeDayPeriod(formatter: Intl.DateTimeFormat, date: Date) {
  const parts = formatter.formatToParts(date);
  return parts
    .filter((part, i) => !(part.type === "literal" && parts[i + 1]?.type === "dayPeriod"))
    .map(part => part.value)
    .join("");
}

export function useBackupSelectionContentViewModel(backupCreatedAt: Date) {
  const {
    i18n: { language: locale },
  } = useTranslation();
  const lastSave = useMemo(
    () => ({
      date: new Intl.DateTimeFormat(locale, { month: "long", day: "numeric" }).format(
        backupCreatedAt,
      ),
      time: formatTimeWithoutSpaceBeforeDayPeriod(
        new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }),
        backupCreatedAt,
      ),
    }),
    [backupCreatedAt, locale],
  );

  return { lastSave };
}
