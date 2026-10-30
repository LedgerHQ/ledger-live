import React from "react";
import { TableCellContent, TableCellContentTitle, TableCellItem } from "@ledgerhq/lumen-ui-react";

type TrendCellViewProps = {
  readonly formattedTrend: string;
  readonly colorClass: string;
};

export function TrendCellView({ formattedTrend, colorClass }: TrendCellViewProps) {
  return (
    <TableCellItem align="end">
      <TableCellContent>
        <TableCellContentTitle>
          <span className={colorClass}>{formattedTrend}</span>
        </TableCellContentTitle>
      </TableCellContent>
    </TableCellItem>
  );
}
