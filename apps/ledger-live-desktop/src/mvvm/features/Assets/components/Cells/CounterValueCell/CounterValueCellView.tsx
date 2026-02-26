import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";

type CounterValueCellViewProps = {
  readonly formattedCounterValue: string;
};

export const CounterValueCellView = ({ formattedCounterValue }: CounterValueCellViewProps) => (
  <TableCellContent align="end" title={formattedCounterValue} />
);
