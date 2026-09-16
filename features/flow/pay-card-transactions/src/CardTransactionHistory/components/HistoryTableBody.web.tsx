import React from "react";
import { TableBody } from "@ledgerhq/lumen-ui-react";
import type { CardTransactionFormatters, CardTransactionItem } from "../../types";
import type { CardHistoryDayGroup } from "../groupCardHistoryItems";
import { DayHeader } from "./DayHeader";
import { HistoryRow } from "./HistoryRow";

const COLUMN_COUNT = 3;

type HistoryTableBodyProps = Readonly<{
  groups: readonly CardHistoryDayGroup[];
  formatters?: CardTransactionFormatters;
  formatDay?: (date: Date) => string;
  onRowClick: (item: CardTransactionItem) => void;
}>;

export function HistoryTableBody({
  groups,
  formatters,
  formatDay,
  onRowClick,
}: HistoryTableBodyProps) {
  return (
    <TableBody>
      {groups.map(group => (
        <React.Fragment key={group.day.toISOString()}>
          <DayHeader day={group.day} columnCount={COLUMN_COUNT} formatDay={formatDay} />
          {group.items.map(item => (
            <HistoryRow
              key={item.transaction.id}
              item={item}
              formatters={formatters}
              onRowClick={onRowClick}
            />
          ))}
        </React.Fragment>
      ))}
    </TableBody>
  );
}
