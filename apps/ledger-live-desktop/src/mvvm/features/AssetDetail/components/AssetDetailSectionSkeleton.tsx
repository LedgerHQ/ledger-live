import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

type Props = Readonly<{
  testId?: string;
  contentClassName?: string;
}>;

export function AssetDetailSectionSkeleton({
  testId,
  contentClassName = "h-56 w-full rounded-12",
}: Props) {
  return (
    <div className="flex flex-col gap-12" data-testid={testId} aria-hidden>
      <Skeleton className="h-12 w-64 rounded-full" />
      <Skeleton className={contentClassName} />
    </div>
  );
}
