import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { ZonePlaceholderProps } from "./ZonePlaceholder.types";

const HEIGHT = {
  header: 56,
  summary: 256,
  address: 48,
  actions: 64,
  notices: 56,
  extras: 112,
} as const;

export function ZonePlaceholder({ zone }: ZonePlaceholderProps) {
  return (
    <Box
      lx={{
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "md",
        backgroundColor: "muted",
      }}
      style={{ height: HEIGHT[zone] }}
      testID={`receive-address-zone-${zone}`}
    >
      <Text typography="body3" lx={{ color: "muted" }}>
        {zone}
      </Text>
    </Box>
  );
}
