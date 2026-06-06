import { useCallback } from "react";
import { track } from "~/analytics";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";

const PAGE = "Market";

export function useMarketAssetPress() {
  const { openFromMarket } = useAssetDetailNavigation();

  return useCallback(
    (asset: MarketAssetDisplayData) => {
      if (!asset.ledgerIds.length) return;

      track("button_clicked", {
        button: "asset",
        currency: asset.ticker.toUpperCase(),
        page: PAGE,
      });
      openFromMarket({
        marketCurrencyId: asset.id,
        ledgerCurrencyIds: asset.ledgerIds,
        source: PAGE,
      });
    },
    [openFromMarket],
  );
}
