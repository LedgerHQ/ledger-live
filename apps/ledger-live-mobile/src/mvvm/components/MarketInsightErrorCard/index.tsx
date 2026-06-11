import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

export const MARKET_INSIGHT_ERROR_CARD_HEIGHT = 68;

type Props = Readonly<{
  title: string;
  message: string;
  width?: number;
  testID?: string;
}>;

export default function MarketInsightErrorCard({ title, message, width, testID }: Props) {
  return (
    <Box testID={testID} lx={cardStyle} style={{ width, height: MARKET_INSIGHT_ERROR_CARD_HEIGHT }}>
      <Text typography="body3" numberOfLines={1} lx={{ color: "muted", marginBottom: "s4" }}>
        {title}
      </Text>
      <Box lx={messageStyle}>
        <Box testID={testID ? `${testID}-icon` : undefined} lx={{ flexShrink: 0 }}>
          <Warning size={16} color="error" />
        </Box>
        <Text typography="body2SemiBold" numberOfLines={1} lx={{ color: "base", flexShrink: 1 }}>
          {message}
        </Text>
      </Box>
    </Box>
  );
}

const cardStyle: LumenViewStyle = {
  backgroundColor: "muted",
  borderRadius: "md",
  padding: "s12",
  justifyContent: "center",
};

const messageStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s6",
};
