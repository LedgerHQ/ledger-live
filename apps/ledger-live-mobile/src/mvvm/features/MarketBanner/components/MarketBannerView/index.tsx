import React, { useCallback, useRef } from "react";
<<<<<<< HEAD:apps/ledger-live-mobile/src/mvvm/features/MarketBanner/components/MarketBannerView/index.tsx
import { FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { Text, Pressable } from "@ledgerhq/lumen-ui-rnative";
=======
import {
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  Pressable,
} from "react-native";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";
>>>>>>> c9459a93fa (fix(review): update as requested int he review):apps/ledger-live-mobile/src/newArch/features/MarketBanner/components/MarketBannerView/index.tsx
import { useTranslation } from "react-i18next";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";
import BannerItem, { ListItem } from "../BannerItem";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";

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

  const handleSwipe = useCallback(
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
    (props: { item: ListItem; index: number }) => (
      <BannerItem
        item={props.item}
        index={props.index}
        range={range}
        onTilePress={onTilePress}
        onViewAllPress={onViewAllPress}
      />
    ),
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
      <Pressable
        onPress={onSectionTitlePress}
        accessibilityLabel={t("marketBanner.title")}
        accessibilityHint={t("marketBanner.viewAllAccessibilityHint")}
        accessibilityRole="button"
      >
        <Flex flexDirection="row" alignItems="center" mb={4} px={16}>
          <Text typography="heading4SemiBold" lx={{ color: "base" }}>
            {t("marketBanner.title")}
          </Text>
          <ChevronRight size={20} color="base" />
        </Flex>
      </Pressable>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
<<<<<<< HEAD:apps/ledger-live-mobile/src/mvvm/features/MarketBanner/components/MarketBannerView/index.tsx
        contentContainerStyle={{ paddingHorizontal: 16 }}
=======
        contentContainerStyle={styles.listContent}
>>>>>>> c9459a93fa (fix(review): update as requested int he review):apps/ledger-live-mobile/src/newArch/features/MarketBanner/components/MarketBannerView/index.tsx
        onScroll={handleSwipe}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        testID="market-banner-list"
      />
    </Flex>
  );
};

export default React.memo(MarketBannerView);
