import React, { memo } from "react";
import { TableGroupHeaderRow } from "@ledgerhq/lumen-ui-react";
import { useLongCalendarFormatted } from "~/renderer/hooks/useDateFormatter";

type DayHeaderProps = {
  readonly day: Date;
  readonly columnCount: number;
};

function DayHeader({ day, columnCount }: DayHeaderProps) {
  const label = useLongCalendarFormatted(day, undefined, {
    showToday: true,
  });
  return <TableGroupHeaderRow colSpan={columnCount}>{label}</TableGroupHeaderRow>;
}

const MemoizedDayHeader = memo(DayHeader);
export { MemoizedDayHeader as DayHeader };
