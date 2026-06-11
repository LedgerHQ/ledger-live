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
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { EMPTY_STATE_MAX_STOCKS } from "LLM/features/WalletAssets/constants";
import { useStocksDiscoverySectionViewModel } from "./useStocksDiscoverySectionViewModel";

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
      testID={`portfolio-discovery-stock-${stock.ticker.toLowerCase()}`}
    >
      {stock.ticker.toUpperCase()}
    </MediaButton>
  );
}

export function StocksDiscoverySection() {
  const { t } = useTranslation();
  const { stocks, isLoading, isError, onPressExploreAll, onItemPress } =
    useStocksDiscoverySectionViewModel();
  const [topRow, bottomRow] = useMemo(() => splitIntoRows(stocks), [stocks]);

  if (!isLoading && (isError || stocks.length === 0)) return null;

  const renderSkeletonPills = () =>
    Array.from({ length: EMPTY_STATE_MAX_STOCKS }, (_, index) => (
      <Skeleton key={index} lx={pillSkeletonStyle} />
    ));

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
      {isLoading ? (
        <Box lx={insetStyle}>
          <Box lx={gridStyle}>
            <Box lx={rowStyle}>{renderSkeletonPills()}</Box>
            <Box lx={rowStyle}>{renderSkeletonPills()}</Box>
          </Box>
        </Box>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Box lx={gridStyle}>
            <Box lx={rowStyle}>
              {topRow.map(stock => (
                <StockPill key={stock.id} stock={stock} onPress={onItemPress} />
              ))}
            </Box>
            <Box lx={rowStyle}>
              {bottomRow.map(stock => (
                <StockPill key={stock.id} stock={stock} onPress={onItemPress} />
              ))}
            </Box>
          </Box>
        </ScrollView>
      )}
    </Box>
  );
}

const exploreAllStyle = { marginLeft: "auto" as const };
const sectionStyle: LumenViewStyle = { gap: "s12", marginHorizontal: "-s16" };
const insetStyle: LumenViewStyle = { paddingHorizontal: "s16" };
const gridStyle: LumenViewStyle = { gap: "s8", paddingHorizontal: "s16" };
const rowStyle: LumenViewStyle = { flexDirection: "row", gap: "s8" };
const pillSkeletonStyle: LumenViewStyle = { width: "s96", height: "s40", borderRadius: "full" };
