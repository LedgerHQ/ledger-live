import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

type StocksSkeletonProps = {
  count: number;
};

export function StocksSkeleton({ count }: Readonly<StocksSkeletonProps>) {
  return (
    <div
      className="scrollbar-none grid grid-flow-col grid-rows-2 gap-8 overflow-x-auto"
      data-testid="stocks-skeleton"
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => `stocks-skeleton-${index}`).map(key => (
        <Skeleton key={key} component="list-item" className="w-[160px] shrink-0" />
      ))}
    </div>
  );
}
