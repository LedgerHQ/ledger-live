import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { SKELETON_LIST_COUNT } from "LLM/constants";
import { AssetListItemSkeleton } from "../components/Skeleton";

type LoadingStateProps = {
  count?: number;
  skeletonTestID?: string;
  lx?: LumenViewStyle;
};

export const AssetLoadingState = ({
  count = SKELETON_LIST_COUNT,
  skeletonTestID,
  lx,
}: LoadingStateProps) => (
  <Box lx={lx}>
    {Array.from({ length: count }, (_, i) => (
      <AssetListItemSkeleton key={i} testID={skeletonTestID} />
    ))}
  </Box>
);
