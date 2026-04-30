import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";

type BalanceCellViewProps = {
  readonly formattedBalance: string;
  readonly className?: string;
};

export const BalanceCellView = ({ formattedBalance, className }: BalanceCellViewProps) => (
  <TableCellContent
    align="end"
    title={className ? <span className={className}>{formattedBalance}</span> : formattedBalance}
  />
);
