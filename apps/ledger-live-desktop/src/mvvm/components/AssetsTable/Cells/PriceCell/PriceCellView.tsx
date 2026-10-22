import React from "react";
import { TableCellItem, TableCellContent, TableCellContentTitle } from "@ledgerhq/lumen-ui-react";

type PriceCellViewProps = {
  readonly formattedPrice: string;
};

export const PriceCellView = ({ formattedPrice }: PriceCellViewProps) => (
  <TableCellItem align="end">
    <TableCellContent>
      <TableCellContentTitle>{formattedPrice}</TableCellContentTitle>
    </TableCellContent>
  </TableCellItem>
);
