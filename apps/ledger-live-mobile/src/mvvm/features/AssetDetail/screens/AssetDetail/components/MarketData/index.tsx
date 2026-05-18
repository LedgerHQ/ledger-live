import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { MarketStats } from "../MarketStats";
import { PricePerformance } from "../PricePerformance";

export function MarketData({ currency }: Readonly<{ currency: AssetDetailCurrencyProps }>) {
  return (
    <Box lx={containerStyle}>
      <MarketStats currency={currency} />
      <PricePerformance currency={currency} />
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s32",
};
