import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

export function LoadingState() {
  return (
    <div data-testid="send-loading-spinner" className="flex items-center py-12">
      <Skeleton className="mr-14 size-48 rounded-full" />
      <div className="flex flex-1 flex-col gap-8">
        <Skeleton className="h-12 w-176 pb-12" />
        <Skeleton className="h-12 w-112" />
      </div>
    </div>
  );
}
