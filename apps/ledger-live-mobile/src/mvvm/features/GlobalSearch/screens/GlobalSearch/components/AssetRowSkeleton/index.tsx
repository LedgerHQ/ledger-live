import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

export function AssetRowSkeleton({ testID }: Readonly<{ testID?: string }>) {
  return (
    <Box lx={rowStyle} testID={testID}>
      <Box lx={leadingStyle}>
        <Skeleton lx={iconStyle} />
        <Skeleton lx={nameStyle} />
      </Box>
      <Skeleton lx={priceStyle} />
    </Box>
  );
}

const rowStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  height: "s40",
};
const leadingStyle: LumenViewStyle = { flexDirection: "row", alignItems: "center", gap: "s8" };
const iconStyle: LumenViewStyle = { width: "s24", height: "s24", borderRadius: "full" };
const nameStyle: LumenViewStyle = { width: "s112", height: "s12", borderRadius: "full" };
const priceStyle: LumenViewStyle = { width: "s48", height: "s12", borderRadius: "full" };
