import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-react";

export function CardSkeleton() {
  return <Skeleton component="tile" data-testid="fear-and-greed-skeleton" />;
}
