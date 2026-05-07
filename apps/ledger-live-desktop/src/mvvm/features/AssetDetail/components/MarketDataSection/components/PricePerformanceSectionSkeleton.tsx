import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

export function PricePerformanceSectionSkeleton() {
  return (
    <div className="flex flex-col gap-8 pt-8" aria-hidden>
      <Skeleton className="h-88 w-full rounded-12" />
      <Skeleton className="h-88 w-full rounded-12" />
      <Skeleton className="h-36 w-full rounded-8" />
    </div>
  );
}
