import React, { memo } from "react";
import { TableGroupHeaderRow } from "@ledgerhq/lumen-ui-react";
import { useCalendarFormatted } from "~/renderer/hooks/useDateFormatter";

type DayHeaderProps = {
  readonly day: Date;
  readonly columnCount: number;
};

function DayHeader({ day, columnCount }: DayHeaderProps) {
  const label = useCalendarFormatted(day);
  return <TableGroupHeaderRow colSpan={columnCount}>{label}</TableGroupHeaderRow>;
}

const MemoizedDayHeader = memo(DayHeader);
export { MemoizedDayHeader as DayHeader };
