import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle, Text } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { StockPillRows } from "LLM/components/StockPillRows";
import { EMPTY_STATE_MAX_STOCKS } from "LLM/features/WalletAssets/constants";
import { useStocksDiscoverySectionViewModel } from "./useStocksDiscoverySectionViewModel";

export function StocksDiscoverySection() {
  const { t } = useTranslation();
  const { stocks, isLoading, isError, onPressExploreAll, onItemPress } =
    useStocksDiscoverySectionViewModel();

  if (!isLoading && (isError || stocks.length === 0)) return null;

  return (
    <Box lx={sectionStyle} testID="portfolio-stocks-discovery">
      <Box lx={insetStyle}>
        <Subheader>
          <SubheaderRow
            onPress={onPressExploreAll}
            accessibilityRole="button"
            testID="portfolio-stocks-discovery-header"
          >
            <SubheaderTitle>{t("wallet.tabs.stocks")}</SubheaderTitle>
            <Text typography="body2" lx={{ color: "interactive" }} style={exploreAllStyle}>
              {t("wallet.stocks.exploreAll")}
            </Text>
          </SubheaderRow>
        </Subheader>
      </Box>
      <StockPillRows
        stocks={stocks}
        isLoading={isLoading}
        onStockPress={onItemPress}
        skeletonPillsPerRow={EMPTY_STATE_MAX_STOCKS}
        testIdPrefix="portfolio-discovery-stock"
      />
    </Box>
  );
}

const exploreAllStyle = { marginLeft: "auto" as const };
const sectionStyle: LumenViewStyle = { gap: "s12", marginHorizontal: "-s16" };
const insetStyle: LumenViewStyle = { paddingHorizontal: "s16" };
