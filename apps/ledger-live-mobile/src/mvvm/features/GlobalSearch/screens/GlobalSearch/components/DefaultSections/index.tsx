import React from "react";
import { ScrollView } from "react-native";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { AssetRowsSection } from "../AssetRowsSection";
import { StocksSection } from "../StocksSection";
import { StatusView } from "../StatusView";
import { GLOBAL_SEARCH_TEST_IDS } from "../../testIds";
import type { GlobalSearchCategory } from "../../useGlobalSearchViewModel";
import type { GlobalSearchDefaultSections } from "../../types";

type Props = Readonly<{
  sections: GlobalSearchDefaultSections;
  isLoading: boolean;
  hasError: boolean;
  onSeeAll: (category: GlobalSearchCategory) => void;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
  onStockPress: (stock: StockSuggestion) => void;
}>;

export function DefaultSections({
  sections,
  isLoading,
  hasError,
  onSeeAll,
  onAssetPress,
  onStockPress,
}: Props) {
  const { t } = useTranslation();

  if (hasError) {
    return (
      <StatusView
        icon={Warning}
        message={t("market.assets.error.title")}
        testID={GLOBAL_SEARCH_TEST_IDS.defaultsError}
      />
    );
  }

  return (
    <ScrollView
      testID={GLOBAL_SEARCH_TEST_IDS.defaultSections}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <Box lx={contentStyle}>
        <AssetRowsSection
          title={t("globalSearch.sections.cryptos")}
          testID={GLOBAL_SEARCH_TEST_IDS.cryptosSection}
          assets={sections.cryptos}
          isLoading={isLoading}
          skeletonCount={3}
          category="crypto"
          onSeeAll={onSeeAll}
          onAssetPress={onAssetPress}
        />
        <StocksSection
          title={t("globalSearch.sections.stocks")}
          testID={GLOBAL_SEARCH_TEST_IDS.stocksSection}
          stocks={sections.stocks}
          isLoading={isLoading}
          category="stocks"
          onSeeAll={onSeeAll}
          onStockPress={onStockPress}
        />
      </Box>
    </ScrollView>
  );
}

const contentStyle: LumenViewStyle = {
  paddingTop: "s24",
  paddingHorizontal: "s16",
  gap: "s16",
};
