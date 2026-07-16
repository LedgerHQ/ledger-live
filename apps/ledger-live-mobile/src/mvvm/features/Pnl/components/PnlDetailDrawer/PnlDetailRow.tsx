import React from "react";
import { Box, Text, Trend } from "@ledgerhq/lumen-ui-rnative";
import { PnlDetailItem } from "./types";

type Props = Readonly<{ item: PnlDetailItem; discreet?: boolean }>;

export function PnlDetailRow({ item, discreet = false }: Props) {
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
      <Box lx={{ alignItems: "flex-end", gap: "s4" }}>
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          {item.value}
        </Text>
        {item.percentage != null &&
          (discreet ? (
            <Text typography="body3" lx={{ color: "muted" }}>
              ***
            </Text>
          ) : (
            <Trend value={item.percentage} size="sm" />
          ))}
      </Box>
    </Box>
  );
}
