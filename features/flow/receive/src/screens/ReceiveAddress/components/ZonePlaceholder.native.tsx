import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

/** A zone of the address screen, in screen order. Each zone's task replaces its placeholder. */
type ReceiveAddressZone = "header" | "summary" | "address" | "actions" | "notices" | "extras";

type ZonePlaceholderProps = Readonly<{
  zone: ReceiveAddressZone;
  /** What the zone will show, once its task lands. */
  label?: string;
}>;

const HEIGHT = {
  header: 56,
  summary: 256,
  address: 48,
  actions: 64,
  notices: 56,
  extras: 112,
} as const;

export function ZonePlaceholder({ zone, label }: ZonePlaceholderProps) {
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
        {label || zone}
      </Text>
    </Box>
  );
}
