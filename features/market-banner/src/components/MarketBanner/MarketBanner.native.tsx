import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

export function MarketBanner() {
  return (
    <Box
      lx={{
        backgroundColor: "error",
        borderRadius: "md",
        padding: "s16",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Box lx={{ flexDirection: "column", gap: "s4", flex: 1 }}>
        <Text typography="body2SemiBold">{"Market Banner"}</Text>
        <Text typography="body3">{"Discover the market"}</Text>
      </Box>
    </Box>
  );
}
