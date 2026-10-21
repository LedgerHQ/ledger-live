import React from "react";
import { TrendCellView } from "./TrendCellView";
import { useTrendCellViewModel } from "./useTrendCellViewModel";

type TrendCellProps = {
  readonly trend?: number | null;
};

export const TrendCell = ({ trend }: TrendCellProps) => (
  <TrendCellView {...useTrendCellViewModel(trend)} />
);
