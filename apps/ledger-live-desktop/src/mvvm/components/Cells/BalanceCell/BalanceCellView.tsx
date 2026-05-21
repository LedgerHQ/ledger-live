import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import { TruncatedText } from "LLD/components/TruncatedText";

type BalanceCellViewProps = {
  readonly formattedBalance: string;
  readonly className?: string;
};

export const BalanceCellView = ({ formattedBalance, className }: BalanceCellViewProps) => (
  <TableCellContent
    align="end"
    title={<TruncatedText text={formattedBalance} className={className} />}
  />
);
