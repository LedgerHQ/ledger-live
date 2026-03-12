import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";

type PriceCellViewProps = {
  readonly formattedPrice: string;
};

export const PriceCellView = ({ formattedPrice }: PriceCellViewProps) => (
  <TableCellContent align="end" title={formattedPrice} />
);
