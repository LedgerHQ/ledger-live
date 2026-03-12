import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";

type TrendCellViewProps = {
  readonly formattedTrend: string;
  readonly colorClass: string;
};

export const TrendCellView = ({ formattedTrend, colorClass }: TrendCellViewProps) => (
  <TableCellContent align="end" title={<span className={colorClass}>{formattedTrend}</span>} />
);
