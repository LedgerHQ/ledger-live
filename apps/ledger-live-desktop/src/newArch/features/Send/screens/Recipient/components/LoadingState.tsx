import React from "react";
import { Skeleton } from "@ledgerhq/ldls-ui-react";

export function LoadingState() {
  return (
    <div className="flex items-center gap-12 p-32">
      <Skeleton className="w-48 h-48 rounded-full" />
      <div className="flex flex-col gap-8 flex-1">
        <Skeleton className="h-16 w-144" />
        <Skeleton className="h-12 w-96" />
      </div>
    </div>
  );
}
