import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";

export function LoadingState() {
  return (
    <Box lx={{ flex: 1, alignContent: "center", flexDirection: "column", marginHorizontal: "s8" }}>
      <Skeleton component="list-item" />
    </Box>
  );
}
