import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { splitIntoTwoRows } from "../utils/splitIntoTwoRows";

type StocksSkeletonProps = {
  count: number;
};

export function StocksSkeleton({ count }: Readonly<StocksSkeletonProps>) {
  const keys = Array.from({ length: count }, (_, index) => `stocks-skeleton-${index}`);
  const rows = splitIntoTwoRows(keys);

  return (
    <div className="scrollbar-none overflow-x-auto" data-testid="stocks-skeleton" aria-hidden>
      <div className="flex w-max flex-col gap-8">
        {rows.map((rowKeys, rowIndex) => (
          <div key={`${rowKeys.join("-")}-${rowIndex}`} className="flex gap-8">
            {rowKeys.map(key => (
              <Skeleton key={key} component="list-item" className="w-[160px] shrink-0" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
