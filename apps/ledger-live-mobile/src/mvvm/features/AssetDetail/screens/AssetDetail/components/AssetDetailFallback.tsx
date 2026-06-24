import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ASSET_DETAIL_TEST_IDS } from "../../../testIds";
import { SectionSkeleton } from "./SectionSkeleton";

export function AssetDetailLoading() {
  return (
    <Box
      lx={{
        flex: 1,
        padding: "s16",
        gap: "s24",
      }}
      testID={ASSET_DETAIL_TEST_IDS.loading}
    >
      <SectionSkeleton
        rows={1}
        rowHeight="s256"
        titleWidth="s128"
        testID="asset-detail-loading-graph"
      />
      <SectionSkeleton rows={4} rowHeight="s40" testID="asset-detail-loading-rows" />
    </Box>
  );
}
