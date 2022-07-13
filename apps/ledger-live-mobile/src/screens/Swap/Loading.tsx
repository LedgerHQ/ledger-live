import React from "react";
import { Box, InfiniteLoader } from "@ledgerhq/native-ui";

export function Loading({ size = 40 }: { size?: number }) {
  return (
    <Box flex={1} justifyContent="center">
      <InfiniteLoader size={size} />
    </Box>
  );
}
