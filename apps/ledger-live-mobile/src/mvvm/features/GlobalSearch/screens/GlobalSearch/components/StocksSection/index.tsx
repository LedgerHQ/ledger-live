import React, { useCallback } from "react";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import {
  Box,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { StockPillRows } from "LLM/components/StockPillRows";
import type { GlobalSearchCategory } from "../../useGlobalSearchViewModel";

const SKELETON_PILLS_PER_ROW = 4;

type Props = Readonly<{
  title: string;
  testID?: string;
  stocks: StockSuggestion[];
  isLoading: boolean;
  category: GlobalSearchCategory;
  onSeeAll: (category: GlobalSearchCategory) => void;
  onStockPress: (stock: StockSuggestion) => void;
}>;

export function StocksSection({
  title,
  testID,
  stocks,
  isLoading,
  category,
  onSeeAll,
  onStockPress,
}: Props) {
  const handleSeeAll = useCallback(() => onSeeAll(category), [onSeeAll, category]);

  if (!isLoading && stocks.length === 0) return null;

  return (
    <Box lx={sectionStyle} testID={testID}>
      <Box lx={insetStyle}>
        <Subheader>
          <SubheaderRow
            onPress={handleSeeAll}
            accessibilityRole="button"
            testID={testID ? `${testID}-header` : undefined}
          >
            <SubheaderTitle>{title}</SubheaderTitle>
            <SubheaderShowMore />
          </SubheaderRow>
        </Subheader>
      </Box>
      <StockPillRows
        stocks={stocks}
        isLoading={isLoading}
        onStockPress={onStockPress}
        skeletonPillsPerRow={SKELETON_PILLS_PER_ROW}
        testIdPrefix="global-search-stock"
      />
    </Box>
  );
}

const sectionStyle: LumenViewStyle = { gap: "s16", marginHorizontal: "-s16" };
const insetStyle: LumenViewStyle = { paddingHorizontal: "s16" };
