import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

export function AddressListSectionSkeleton() {
  return (
    <div
      className="flex flex-col gap-12"
      data-testid="asset-detail-address-list-skeleton"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-8">
        <Skeleton className="h-12 w-40 rounded-full" />
        <Skeleton className="h-12 w-24 rounded-full" />
      </div>
      <Skeleton className="h-56 w-full rounded-12" />
    </div>
  );
}
