import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";

type CounterValueCellViewProps = {
  readonly formattedCounterValue: string;
  readonly className?: string;
};

export const CounterValueCellView = ({
  formattedCounterValue,
  className,
}: CounterValueCellViewProps) => (
  <TableCellContent
    align="end"
    title={
      className ? <span className={className}>{formattedCounterValue}</span> : formattedCounterValue
    }
  />
);
