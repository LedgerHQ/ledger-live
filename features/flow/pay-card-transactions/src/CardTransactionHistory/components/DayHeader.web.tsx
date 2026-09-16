import React, { useMemo } from "react";
import { TableGroupHeaderRow } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";

type DayHeaderProps = Readonly<{
  day: Date;
  columnCount: number;
  formatDay?: (date: Date) => string;
}>;

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function DayHeader({ day, columnCount, formatDay }: DayHeaderProps) {
  const { t } = useTranslation();
  const label = useMemo(() => {
    const now = new Date();
    if (isSameCalendarDay(day, now)) {
      return t("payTab.cardTransactions.history.today");
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameCalendarDay(day, yesterday)) {
      return t("payTab.cardTransactions.history.yesterday");
    }

    if (formatDay) return formatDay(day);

    return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(day);
  }, [day, formatDay, t]);

  return <TableGroupHeaderRow colSpan={columnCount}>{label}</TableGroupHeaderRow>;
}
