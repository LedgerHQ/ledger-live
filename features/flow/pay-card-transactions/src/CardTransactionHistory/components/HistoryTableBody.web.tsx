import React from "react";
import { TableBody } from "@ledgerhq/lumen-ui-react";
import type { CardTransactionFormatters, CardTransactionItem } from "../../types";
import type { CardTransactionHistoryColumnSet } from "../types";
import type { CardHistoryDayGroup } from "../groupCardHistoryItems";
import { DayHeader } from "./DayHeader";
import { HistoryRow } from "./HistoryRow";

type HistoryTableBodyProps = Readonly<{
  groups: readonly CardHistoryDayGroup[];
  formatters?: CardTransactionFormatters;
  columnSet?: CardTransactionHistoryColumnSet;
  assetCode?: string;
  formatDay?: (date: Date) => string;
  onRowClick: (item: CardTransactionItem) => void;
}>;

export function HistoryTableBody({
  groups,
  formatters,
  columnSet = "card",
  assetCode,
  formatDay,
  onRowClick,
}: HistoryTableBodyProps) {
  const columnCount = 3;

  return (
    <TableBody>
      {groups.map(group => (
        <React.Fragment key={group.day?.toISOString() ?? "unknown"}>
          <DayHeader
            day={group.day}
            columnCount={columnCount}
            formatDay={formatDay ?? formatters?.date}
          />
          {group.items.map(item => (
            <HistoryRow
              key={item.transaction.id}
              item={item}
              formatters={formatters}
              columnSet={columnSet}
              assetCode={assetCode}
              onRowClick={onRowClick}
            />
          ))}
        </React.Fragment>
      ))}
    </TableBody>
  );
}
