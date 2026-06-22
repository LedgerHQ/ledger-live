import React, { useCallback, useMemo } from "react";
import { ScrollView } from "react-native";
import Icon from "@ledgerhq/crypto-icons/native";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import { Box, MediaButton, Skeleton } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

type Props = Readonly<{
  stocks: StockSuggestion[];
  isLoading: boolean;
  onStockPress: (stock: StockSuggestion) => void;
  skeletonPillsPerRow: number;
  testIdPrefix: string;
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
  testIdPrefix: string;
}>;

function StockPill({ stock, onPress, testIdPrefix }: StockPillProps) {
  const handlePress = useCallback(() => onPress(stock), [stock, onPress]);

  return (
    <MediaButton
      size="sm"
      hideChevron
      leadingContentShape="rounded"
      leadingContent={<Icon ledgerId={stock.ledgerId} ticker={stock.ticker} size={24} />}
      onPress={handlePress}
      accessibilityLabel={stock.name}
      testID={`${testIdPrefix}-${stock.ticker.toLowerCase()}`}
    >
      {stock.ticker.toUpperCase()}
    </MediaButton>
  );
}

export function StockPillRows({
  stocks,
  isLoading,
  onStockPress,
  skeletonPillsPerRow,
  testIdPrefix,
}: Props) {
  const [topRow, bottomRow] = useMemo(() => splitIntoRows(stocks), [stocks]);

  const renderSkeletonPills = () =>
    Array.from({ length: skeletonPillsPerRow }, (_, index) => (
      <Skeleton key={index} lx={pillSkeletonStyle} />
    ));

  if (isLoading) {
    return (
      <Box lx={gridStyle}>
        <Box lx={rowStyle}>{renderSkeletonPills()}</Box>
        <Box lx={rowStyle}>{renderSkeletonPills()}</Box>
      </Box>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Box lx={gridStyle}>
        <Box lx={rowStyle}>
          {topRow.map(stock => (
            <StockPill
              key={stock.id}
              stock={stock}
              onPress={onStockPress}
              testIdPrefix={testIdPrefix}
            />
          ))}
        </Box>
        <Box lx={rowStyle}>
          {bottomRow.map(stock => (
            <StockPill
              key={stock.id}
              stock={stock}
              onPress={onStockPress}
              testIdPrefix={testIdPrefix}
            />
          ))}
        </Box>
      </Box>
    </ScrollView>
  );
}

const gridStyle: LumenViewStyle = { gap: "s8", paddingHorizontal: "s16" };
const rowStyle: LumenViewStyle = { flexDirection: "row", gap: "s8" };
const pillSkeletonStyle: LumenViewStyle = { width: "s96", height: "s40", borderRadius: "full" };
