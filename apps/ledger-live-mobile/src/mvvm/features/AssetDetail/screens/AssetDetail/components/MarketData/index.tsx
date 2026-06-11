import React from "react";
import { Box, DescriptionItem, DescriptionItemLabel } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { MarketStats } from "../MarketStats";
import { PricePerformance } from "../PricePerformance";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
}>;

export function MarketData({ currency, marketApiId, knownLedgerIds, knownMarketId }: Props) {
  const { t } = useTranslation();
  return (
    <Box lx={containerStyle}>
      <MarketStats
        currency={currency}
        marketApiId={marketApiId}
        knownLedgerIds={knownLedgerIds}
        knownMarketId={knownMarketId}
      />
      <PricePerformance
        currency={currency}
        marketApiId={marketApiId}
        knownLedgerIds={knownLedgerIds}
        knownMarketId={knownMarketId}
      />
      <DescriptionItem>
        <DescriptionItemLabel>{t("assetDetail.marketStats.disclaimer")}</DescriptionItemLabel>
      </DescriptionItem>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s16",
};
