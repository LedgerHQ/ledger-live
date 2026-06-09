import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

type StocksSkeletonProps = Readonly<{
  count: number;
}>;

export function StocksSkeleton({ count }: StocksSkeletonProps) {
  return (
    <div
      className="scrollbar-none grid grid-flow-col grid-rows-2 gap-8 overflow-x-auto"
      data-testid="stocks-skeleton"
      aria-hidden
    >
      {getSkeletonItemKeys(count).map(key => (
        <Skeleton key={key} component="list-item" className="w-[160px] shrink-0" />
      ))}
    </div>
  );
}

function getSkeletonItemKeys(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `stock-skeleton-${i}`);
}
