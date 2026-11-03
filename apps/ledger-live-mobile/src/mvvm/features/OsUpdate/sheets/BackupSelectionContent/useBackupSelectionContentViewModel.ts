import { useMemo } from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { useLocale } from "~/context/Locale";

function formatTimeWithoutSpaceBeforeDayPeriod(formatter: Intl.DateTimeFormat, date: Date) {
  const parts = formatter.formatToParts(date);
  return parts
    .filter((part, i) => !(part.type === "literal" && parts[i + 1]?.type === "dayPeriod"))
    .map(part => part.value)
    .join("");
}

export function useBackupSelectionContentViewModel(
  deviceModelId: DeviceModelId,
  backupCreatedAt: Date,
) {
  const { locale } = useLocale();
  const { productName } = getDeviceModel(deviceModelId);
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

  return { productName, lastSave };
}
