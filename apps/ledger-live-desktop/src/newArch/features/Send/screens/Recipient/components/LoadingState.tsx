import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

export function LoadingState() {
  return (
    <div className="flex items-center py-12">
      <Skeleton className="size-48 rounded-full mr-14" />
      <div className="flex flex-col gap-8 flex-1">
        <Skeleton className="h-12 w-176 pb-10" />
        <Skeleton className="h-12 w-112" />
      </div>
    </div>
  );
}
