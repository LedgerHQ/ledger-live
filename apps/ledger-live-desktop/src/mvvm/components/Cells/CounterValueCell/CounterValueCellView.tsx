import React from "react";
import { TableCellItem, TableCellContent, TableCellContentTitle } from "@ledgerhq/lumen-ui-react";

type CounterValueCellViewProps = {
  readonly formattedCounterValue: string;
  readonly className?: string;
};

export const CounterValueCellView = ({
  formattedCounterValue,
  className,
}: CounterValueCellViewProps) => (
  <TableCellItem align="end">
    <TableCellContent>
      <TableCellContentTitle>
        {className ? (
          <span className={className}>{formattedCounterValue}</span>
        ) : (
          formattedCounterValue
        )}
      </TableCellContentTitle>
    </TableCellContent>
  </TableCellItem>
);
