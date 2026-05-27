import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

export function TotalBalanceSkeleton() {
  return (
    <div
      className="flex flex-col gap-8"
      data-testid="asset-detail-total-balance-skeleton"
      aria-hidden
    >
      <Skeleton className="h-12 w-32 rounded-full" />
      <Skeleton className="h-48 w-1/2 rounded-8" />
    </div>
  );
}
