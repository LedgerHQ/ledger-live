import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { MarketStats } from "../MarketStats";
import { PricePerformance } from "../PricePerformance";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
}>;

export function MarketData({ currency }: Props) {
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
