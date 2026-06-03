import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

type LineChartLoadingProps = Readonly<{
  height: number;
}>;

export function LineChartLoading({ height }: LineChartLoadingProps) {
  return (
    <Skeleton
      data-testid="line-chart-loading"
      className="w-full rounded-md"
      style={{ height }}
      aria-hidden
    />
  );
}
