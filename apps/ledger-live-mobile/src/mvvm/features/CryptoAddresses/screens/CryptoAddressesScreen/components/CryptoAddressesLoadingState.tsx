import React from "react";
import { Box, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

const SKELETON_COUNT = 6;

export default function CryptoAddressesLoadingState() {
  return (
    <Box lx={containerStyle}>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <Skeleton key={i} component="list-item" />
      ))}
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s12",
  paddingVertical: "s16",
};
