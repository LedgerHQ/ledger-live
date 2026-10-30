import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

const SKELETON_ROW_COUNT = 3;

export function OperationsSkeleton() {
  return (
    <div className="flex flex-col gap-12" data-testid="history-operations-skeleton" aria-hidden>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <Skeleton key={index} className="h-[64px] w-full rounded-12" />
      ))}
    </div>
  );
}
