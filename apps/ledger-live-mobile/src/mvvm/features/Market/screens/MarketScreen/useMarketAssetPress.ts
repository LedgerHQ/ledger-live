import { useCallback } from "react";
import { track } from "~/analytics";
import { useAssetDetailNavigation } from "LLM/features/AssetDetail/hooks/useAssetDetailNavigation";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import type { MarketListCategory } from "~/reducers/types";

const PAGE = "Market";

export function useMarketAssetPress(category: MarketListCategory) {
  const { openFromMarket } = useAssetDetailNavigation();

  return useCallback(
    (asset: MarketAssetDisplayData) => {
      if (!asset.ledgerIds.length) return;

      track("button_clicked", {
        button: "asset",
        currency: asset.ticker.toUpperCase(),
        page: PAGE,
        category,
      });
      openFromMarket({
        marketCurrencyId: asset.id,
        ledgerCurrencyIds: asset.ledgerIds,
        source: PAGE,
      });
    },
    [openFromMarket, category],
  );
}
