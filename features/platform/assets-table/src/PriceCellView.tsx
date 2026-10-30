import React from "react";
import { TableCellContent, TableCellContentTitle, TableCellItem } from "@ledgerhq/lumen-ui-react";

type PriceCellViewProps = {
  readonly formattedPrice: string;
};

export function PriceCellView({ formattedPrice }: PriceCellViewProps) {
  return (
    <TableCellItem align="end">
      <TableCellContent>
        <TableCellContentTitle>{formattedPrice}</TableCellContentTitle>
      </TableCellContent>
    </TableCellItem>
  );
}
