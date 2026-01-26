import React, { useCallback, useRef } from "react";
import { FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { Text, Pressable } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "react-i18next";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";
import BannerItem, { ListItem } from "../BannerItem";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import { FearAndGreed } from "LLM/components/FearAndGreed";
import ViewAllTile from "../ViewAllTile";
import { BannerStates } from "../BannerStates";

interface MarketBannerViewProps {
  items: MarketItemPerformer[];
  range: PortfolioRange;
  isError: boolean;
  onTilePress: (item: MarketItemPerformer) => void;
  onViewAllPress: () => void;
  onSectionTitlePress: () => void;
  onSwipe: () => void;
  testID?: string;
}

const HEIGHT = 102;
const MARGIN_RIGHT = 8;
const PADDING_HORIZONTAL = 16;
const MARGIN_HORIZONTAL = -16;

const MarketBannerView = ({
  items,
  range,
  isError,
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

  const renderItem = useCallback(
    (props: { item: ListItem; index: number }) => (
      <BannerItem item={props.item} index={props.index} range={range} onTilePress={onTilePress} />
    ),
    [range, onTilePress],
  );

  return (
    <Flex testID={testID} mb={24}>
      <Pressable
        onPress={onSectionTitlePress}
        accessibilityLabel={t("marketBanner.title")}
        accessibilityHint={t("marketBanner.viewAllAccessibilityHint")}
        accessibilityRole="button"
      >
        <Flex flexDirection="row" alignItems="center" mb={4}>
          <Text typography="heading4SemiBold" lx={{ color: "base" }}>
            {t("marketBanner.title")}
          </Text>
          <ChevronRight size={20} color="base" />
        </Flex>
      </Pressable>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={<FearAndGreed />}
        ListFooterComponent={<ViewAllTile onPress={onViewAllPress} />}
        ListEmptyComponent={<BannerStates isError={isError} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleSwipe}
        scrollEventThrottle={16}
        testID="market-banner-list"
        ListHeaderComponentStyle={{ marginRight: MARGIN_RIGHT }}
        contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL, height: HEIGHT }}
        style={{ marginHorizontal: MARGIN_HORIZONTAL }}
      />
    </Flex>
  );
};

export default React.memo(MarketBannerView);
