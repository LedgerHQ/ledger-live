import React from "react";
import { Box, Text, Trend } from "@ledgerhq/lumen-ui-rnative";

type Props = {
  percent: number;
  price: string;
};

export const MarketPriceIndicator = ({ percent, price }: Props) => (
  <Box lx={{ flexDirection: "column", alignItems: "flex-end", gap: "s4" }}>
    <Text typography="body2SemiBold" lx={{ color: "base" }}>
      {price}
    </Text>
    <Trend value={percent} size="sm" />
  </Box>
);
