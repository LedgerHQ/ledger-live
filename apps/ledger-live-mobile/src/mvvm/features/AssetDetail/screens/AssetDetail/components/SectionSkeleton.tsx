import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type SkeletonSize = NonNullable<LumenViewStyle["height"]>;

type Props = Readonly<{
  rows: number;
  rowHeight: SkeletonSize;
  titleWidth?: SkeletonSize;
  testID?: string;
}>;

export const SECTION_SKELETON_TEST_ID = "asset-detail-section-skeleton";

export function SectionSkeleton({
  rows,
  rowHeight,
  titleWidth = "s256",
  testID = SECTION_SKELETON_TEST_ID,
}: Props) {
  return (
    <Box lx={containerStyle} testID={testID}>
      <Skeleton lx={{ height: "s12", width: titleWidth, borderRadius: "full" }} />
      <Box lx={rowsContainerStyle}>
        {getSkeletonRowKeys(rows).map(key => (
          <Skeleton key={key} lx={{ height: rowHeight, width: "full", borderRadius: "md" }} />
        ))}
      </Box>
    </Box>
  );
}

function getSkeletonRowKeys(rows: number): string[] {
  return Array.from({ length: rows }, (_, i) => `skeleton-row-${i}`);
}

const containerStyle: LumenViewStyle = {
  gap: "s16",
};

const rowsContainerStyle: LumenViewStyle = {
  gap: "s8",
};
