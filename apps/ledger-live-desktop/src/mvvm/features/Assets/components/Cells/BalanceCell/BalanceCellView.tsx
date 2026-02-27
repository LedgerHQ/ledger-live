import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";

type BalanceCellViewProps = {
  readonly formattedBalance: string;
};

export const BalanceCellView = ({ formattedBalance }: BalanceCellViewProps) => (
  <TableCellContent align="end" title={formattedBalance} />
);
