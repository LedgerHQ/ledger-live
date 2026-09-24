import React, { useMemo } from "react";
import { TableGroupHeaderRow } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { formatHistoryDayLabel } from "../../CardTransactions/components/ListItem/formatCardTransactionItem";

type DayHeaderProps = Readonly<{
  day?: Date;
  columnCount: number;
  formatDay?: (date: Date) => string;
}>;

export function DayHeader({ day, columnCount, formatDay }: DayHeaderProps) {
  const { t } = useTranslation();
  const label = useMemo(
    () => formatHistoryDayLabel(day, key => t(`payTab.cardTransactions.history.${key}`), formatDay),
    [day, formatDay, t],
  );

  return <TableGroupHeaderRow colSpan={columnCount}>{label}</TableGroupHeaderRow>;
}
