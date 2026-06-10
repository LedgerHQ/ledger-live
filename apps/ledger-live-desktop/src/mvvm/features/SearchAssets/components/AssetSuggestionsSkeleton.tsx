import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

type AssetSuggestionsSkeletonProps = {
  count: number;
  testIdPrefix: string;
};

export function AssetSuggestionsSkeleton({
  count,
  testIdPrefix,
}: Readonly<AssetSuggestionsSkeletonProps>) {
  return (
    <div className="flex flex-col gap-8" data-testid={`${testIdPrefix}-skeleton`} aria-hidden>
      {Array.from({ length: count }, (_, index) => `${testIdPrefix}-skeleton-${index}`).map(key => (
        <Skeleton key={key} component="list-item" />
      ))}
    </div>
  );
}
