import React, { useCallback, useRef } from "react";
import { FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import { PortfolioRange } from "@ledgerhq/types-live";
import BannerItem, { ListItem } from "../BannerItem";
import { FearAndGreed } from "LLM/components/FearAndGreed";
import ViewAllTile from "../ViewAllTile";
import { ErrorState } from "../ErrorState";
import { SkeletonState } from "../SkeletonState";

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
    <Box testID={testID} lx={{ marginBottom: "s24" }}>
      <Subheader>
        <SubheaderRow
          onPress={onSectionTitlePress}
          lx={{ marginBottom: "s12" }}
          accessibilityRole="button"
          accessibilityLabel={t("marketBanner.title")}
          accessibilityHint={t("marketBanner.accessibilityHint")}
        >
          <SubheaderTitle>{t("marketBanner.title")}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>

      {isError ? (
        <ErrorState />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={<FearAndGreed />}
          ListFooterComponent={<ViewAllTile onPress={onViewAllPress} />}
          ListEmptyComponent={<SkeletonState />}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleSwipe}
          scrollEventThrottle={16}
          testID="market-banner-list"
          ListHeaderComponentStyle={{ marginRight: MARGIN_RIGHT }}
          contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL, height: HEIGHT }}
          style={{ marginHorizontal: MARGIN_HORIZONTAL }}
        />
      )}
    </Box>
  );
};

export default React.memo(MarketBannerView);
