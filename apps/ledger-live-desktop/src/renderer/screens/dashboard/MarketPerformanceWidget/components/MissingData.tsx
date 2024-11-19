import React from "react";
import { Order } from "../types";
import { Error } from "./Error";
import { PortfolioRange } from "@ledgerhq/types-live";

type Props = {
  order: Order;
  range: PortfolioRange;
  top: number;
};

export function MissingData({ order, top, range }: Props) {
  const key = order === Order.asc ? "gainers" : "losers";
  const title = `dashboard.marketPerformanceWidget.missingData.${key}.title`;
  const description = `dashboard.marketPerformanceWidget.missingData.${key}.description`;
  return <Error title={title} description={description} top={top} range={range} />;
}
