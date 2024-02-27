import React from "react";
import { Order } from "../types";
import { Error } from "./Error";

type Props = {
  order: Order;
};

export function MissingData({ order }: Props) {
  const key = order === Order.asc ? "gainers" : "losers";
  const title = `dashboard.marketPerformanceWidget.missingData.${key}.title`;
  const description = `dashboard.marketPerformanceWidget.missingData.${key}.description`;
  return <Error title={title} description={description} />;
}
