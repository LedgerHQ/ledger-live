import React, { useCallback, useMemo } from "react";
import { ScrollView } from "react-native";
import Icon from "@ledgerhq/crypto-icons/native";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import {
  Box,
  MediaButton,
  Skeleton,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
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

function splitIntoRows(stocks: StockSuggestion[]): [StockSuggestion[], StockSuggestion[]] {
  const top: StockSuggestion[] = [];
  const bottom: StockSuggestion[] = [];
  stocks.forEach((stock, index) => (index % 2 === 0 ? top : bottom).push(stock));
  return [top, bottom];
}

type StockPillProps = Readonly<{
  stock: StockSuggestion;
  onPress: (stock: StockSuggestion) => void;
}>;

function StockPill({ stock, onPress }: StockPillProps) {
  const handlePress = useCallback(() => onPress(stock), [stock, onPress]);

  return (
    <MediaButton
      size="sm"
      hideChevron
      leadingContentShape="rounded"
      leadingContent={<Icon ledgerId={stock.ledgerId} ticker={stock.ticker} size={24} />}
      onPress={handlePress}
      accessibilityLabel={stock.name}
      testID={`global-search-stock-${stock.ticker.toLowerCase()}`}
    >
      {stock.ticker.toUpperCase()}
    </MediaButton>
  );
}

export function StocksSection({
  title,
  testID,
  stocks,
  isLoading,
  category,
  onSeeAll,
  onStockPress,
}: Props) {
  const [topRow, bottomRow] = useMemo(() => splitIntoRows(stocks), [stocks]);
  const handleSeeAll = useCallback(() => onSeeAll(category), [onSeeAll, category]);

  if (!isLoading && stocks.length === 0) return null;

  const renderSkeletonPills = () =>
    Array.from({ length: SKELETON_PILLS_PER_ROW }, (_, index) => (
      <Skeleton key={index} lx={pillSkeletonStyle} />
    ));

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
      {isLoading ? (
        <Box lx={insetStyle}>
          <Box lx={skeletonGridStyle}>
            <Box lx={rowStyle}>{renderSkeletonPills()}</Box>
            <Box lx={rowStyle}>{renderSkeletonPills()}</Box>
          </Box>
        </Box>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Box lx={gridStyle}>
            <Box lx={rowStyle}>
              {topRow.map(stock => (
                <StockPill key={stock.id} stock={stock} onPress={onStockPress} />
              ))}
            </Box>
            <Box lx={rowStyle}>
              {bottomRow.map(stock => (
                <StockPill key={stock.id} stock={stock} onPress={onStockPress} />
              ))}
            </Box>
          </Box>
        </ScrollView>
      )}
    </Box>
  );
}

const sectionStyle: LumenViewStyle = { gap: "s16", marginHorizontal: "-s16" };
const insetStyle: LumenViewStyle = { paddingHorizontal: "s16" };
const gridStyle: LumenViewStyle = { gap: "s8", paddingHorizontal: "s16" };
const skeletonGridStyle: LumenViewStyle = { gap: "s8" };
const rowStyle: LumenViewStyle = { flexDirection: "row", gap: "s8" };
const pillSkeletonStyle: LumenViewStyle = { width: "s96", height: "s40", borderRadius: "full" };
