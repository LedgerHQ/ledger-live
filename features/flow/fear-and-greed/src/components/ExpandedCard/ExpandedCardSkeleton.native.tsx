import React from "react";
import { Skeleton } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { EXPANDED_CARD_HEIGHT } from "./constants";

type ExpandedCardSkeletonProps = Readonly<{
  width?: number;
  testID?: string;
}>;

export function ExpandedCardSkeleton({ width, testID }: ExpandedCardSkeletonProps) {
  return (
    <Skeleton testID={testID} lx={skeletonStyle} style={{ width, height: EXPANDED_CARD_HEIGHT }} />
  );
}

const skeletonStyle: LumenViewStyle = {
  borderRadius: "md",
};
