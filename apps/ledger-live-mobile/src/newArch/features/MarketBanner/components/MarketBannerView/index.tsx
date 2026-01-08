import React, { useCallback, useRef } from "react";
import {
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";
import MarketTile from "../MarketTile";
import ViewAllTile from "../ViewAllTile";
import SkeletonTile from "../SkeletonTile";

interface MarketBannerViewProps {
  items: MarketItemPerformer[];
  isLoading: boolean;
  range: PortfolioRange;
  onTilePress: (item: MarketItemPerformer) => void;
  onViewAllPress: () => void;
  onSectionTitlePress: () => void;
  onSwipe: () => void;
  testID?: string;
}

type ListItem = MarketItemPerformer | { type: "viewAll" } | { type: "skeleton"; id: number };

const TILE_TOTAL_WIDTH = 98;

const MarketBannerView = ({
  items,
  isLoading,
  range,
  onTilePress,
  onViewAllPress,
  onSectionTitlePress,
  onSwipe,
  testID = "market-banner-container",
}: MarketBannerViewProps) => {
  const { t } = useTranslation();
  const hasTrackedSwipe = useRef(false);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      if (contentOffset.x > 20 && !hasTrackedSwipe.current) {
        hasTrackedSwipe.current = true;
        onSwipe();
      }
    },
    [onSwipe],
  );

  const listData: ListItem[] = isLoading
    ? Array.from({ length: 8 }, (_, i) => ({ type: "skeleton" as const, id: i }))
    : [...items, { type: "viewAll" as const }];

  const renderItem = useCallback(
    (props: { item: ListItem; index: number }) => {
      const { item, index } = props;
      if ("type" in item && item.type === "viewAll") {
        return <ViewAllTile onPress={onViewAllPress} />;
      }
      if ("type" in item && item.type === "skeleton") {
        return <SkeletonTile index={index} />;
      }

      return <MarketTile item={item} index={index} range={range} onPress={onTilePress} />;
    },
    [range, onTilePress, onViewAllPress],
  );

  const keyExtractor = useCallback((item: ListItem): string => {
    if ("type" in item) {
      return item.type === "viewAll" ? "view-all" : `skeleton-${item.id}`;
    }
    return (item as MarketItemPerformer).id;
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: TILE_TOTAL_WIDTH,
      offset: TILE_TOTAL_WIDTH * index,
      index,
    }),
    [],
  );

  return (
    <Flex testID={testID} mb={24}>
      <TouchableOpacity
        onPress={onSectionTitlePress}
        activeOpacity={0.7}
        accessibilityLabel={t("marketBanner.title")}
        accessibilityHint={t("marketBanner.viewAllAccessibilityHint")}
        accessibilityRole="button"
      >
        <Flex flexDirection="row" alignItems="center" mb={4} style={styles.header}>
          <Text variant="h5" fontWeight="semiBold" color="neutral.c100">
            {t("marketBanner.title")}
          </Text>
          <Icons.ChevronRight size="S" color="neutral.c70" />
        </Flex>
      </TouchableOpacity>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        testID="market-banner-list"
      />
    </Flex>
  );
};

const HORIZONTAL_PADDING = 16;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  listContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
});

export default React.memo(MarketBannerView);
