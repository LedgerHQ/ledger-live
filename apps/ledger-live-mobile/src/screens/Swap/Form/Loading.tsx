import React from "react";
import { Box, InfiniteLoader } from "@ledgerhq/native-ui";

export function Loading() {
  return (
    <Box flex={1} justifyContent="center">
      <InfiniteLoader size={40} />
    </Box>
  );
}
