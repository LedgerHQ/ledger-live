import React from "react";
import { Box, InfiniteLoader } from "@ledgerhq/native-ui";

export default function LoadingIndicator() {
  return (
    <Box height={40} testID="web3hub-loading-indicator">
      <InfiniteLoader size={30} />
    </Box>
  );
}
