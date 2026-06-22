import React from "react";
import { listItemHeight } from "~/renderer/screens/market/components/Table";
import { MARKET_TABLE_GRID_TEMPLATE } from "./constants";

const SKELETON_ROW_KEYS = Array.from(
  { length: 12 },
  (_, index) => `market-table-skeleton-row-${index}`,
);

export function MarketTableSkeleton() {
  return (
    <div data-testid="market-table-skeleton">
      {SKELETON_ROW_KEYS.map(key => (
        <div
          key={key}
          className="grid w-full items-center px-12"
          style={{ gridTemplateColumns: MARKET_TABLE_GRID_TEMPLATE, height: listItemHeight }}
        >
          <div className="flex items-center gap-12">
            <div className="size-32 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="h-12 w-96 animate-pulse rounded-xs bg-muted" />
          </div>
          <div className="h-12 w-64 animate-pulse justify-self-end rounded-xs bg-muted" />
          <div className="h-12 w-64 animate-pulse justify-self-end rounded-xs bg-muted" />
          <div className="h-12 w-64 animate-pulse justify-self-end rounded-xs bg-muted" />
          <div className="h-12 w-48 animate-pulse justify-self-end rounded-xs bg-muted" />
          <div />
        </div>
      ))}
    </div>
  );
}
