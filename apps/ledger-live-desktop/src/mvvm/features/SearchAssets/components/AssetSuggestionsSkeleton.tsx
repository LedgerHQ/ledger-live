import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";

type AssetSuggestionsSkeletonProps = {
  count: number;
  testIdPrefix: string;
  className?: string;
  density?: "compact" | "default";
};

export function AssetSuggestionsSkeleton({
  count,
  testIdPrefix,
  className,
  density = "compact",
}: Readonly<AssetSuggestionsSkeletonProps>) {
  return (
    <div
      className={cn("flex flex-col", className)}
      data-testid={`${testIdPrefix}-skeleton`}
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => `${testIdPrefix}-skeleton-${index}`).map(key =>
        density === "compact" ? (
          <div key={key} className="flex h-40 w-full items-center gap-16 px-8">
            <Skeleton className="size-24 shrink-0 rounded-full" />
            <Skeleton className="h-12 w-176 rounded-full" />
          </div>
        ) : (
          <Skeleton key={key} component="list-item" className="w-full" />
        ),
      )}
    </div>
  );
}
