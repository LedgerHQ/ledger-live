import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-rnative";

export const ListItemSkeleton = () => (
  <Skeleton component="list-item" testID="crypto-list-item-skeleton" />
);
