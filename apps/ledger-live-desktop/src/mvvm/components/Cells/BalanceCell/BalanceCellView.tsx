import React from "react";
import { TableCellItem, TableCellContent, TableCellContentTitle } from "@ledgerhq/lumen-ui-react";
import { TruncatedText } from "LLD/components/TruncatedText";

type BalanceCellViewProps = {
  readonly formattedBalance: string;
  readonly className?: string;
};

export const BalanceCellView = ({ formattedBalance, className }: BalanceCellViewProps) => (
  <TableCellItem align="end">
    <TableCellContent>
      <TableCellContentTitle>
        <TruncatedText text={formattedBalance} className={className} />
      </TableCellContentTitle>
    </TableCellContent>
  </TableCellItem>
);
