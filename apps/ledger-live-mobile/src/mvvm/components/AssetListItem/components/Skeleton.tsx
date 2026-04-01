import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-rnative";

interface AssetListItemSkeletonProps {
  testID?: string;
}

export const AssetListItemSkeleton = ({
  testID = "asset-list-item-skeleton",
}: AssetListItemSkeletonProps) => <Skeleton component="list-item" testID={testID} />;
