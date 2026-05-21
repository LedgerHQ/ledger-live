import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { PnlDetailItem } from "./types";

type Props = Readonly<{ item: PnlDetailItem }>;

export function PnlDetailRow({ item }: Props) {
  return (
    <Box
      lx={{ flexDirection: "row", alignItems: "flex-start", gap: "s16" }}
      testID={`pnl-detail-row-${item.title}`}
    >
      <Box lx={{ flex: 1, gap: "s4" }}>
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          {item.title}
        </Text>
        {item.definition ? (
          <Text typography="body3" lx={{ color: "muted" }}>
            {item.definition}
          </Text>
        ) : null}
      </Box>
      <Text typography="body2SemiBold" lx={{ color: "base" }}>
        {item.value}
      </Text>
    </Box>
  );
}
