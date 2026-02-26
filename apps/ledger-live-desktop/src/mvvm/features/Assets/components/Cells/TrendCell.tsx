import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";

type TrendCellProps = {
  readonly priceChangePercentage24h: number | undefined;
};

export const TrendCell = ({ priceChangePercentage24h }: TrendCellProps) => {
  if (priceChangePercentage24h == null) {
    return <TableCellContent align="end" title={<span className="text-muted">-</span>} />;
  }

  const sign = priceChangePercentage24h >= 0 ? "+" : "";
  const formatted = `${sign}${priceChangePercentage24h.toFixed(2)}%`;
  const colorClass = priceChangePercentage24h >= 0 ? "text-success" : "text-error";

  return (
    <TableCellContent align="end" title={<span className={cn(colorClass)}>{formatted}</span>} />
  );
};
