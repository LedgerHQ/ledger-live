import React from "react";
import { TableCellItem, TableCellContent, TableCellContentTitle } from "@ledgerhq/lumen-ui-react";

type TrendCellViewProps = {
  readonly formattedTrend: string;
  readonly colorClass: string;
};

export const TrendCellView = ({ formattedTrend, colorClass }: TrendCellViewProps) => (
  <TableCellItem align="end">
    <TableCellContent>
      <TableCellContentTitle>
        <span className={colorClass}>{formattedTrend}</span>
      </TableCellContentTitle>
    </TableCellContent>
  </TableCellItem>
);
