import React, { useCallback } from "react";
import { FlatList } from "react-native";
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
  testID?: string;
}

const HEIGHT = 108;
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
  testID = "market-banner-container",
}: MarketBannerViewProps) => {
  const { t } = useTranslation();

  const renderItem = useCallback(
    (props: { item: ListItem; index: number }) => (
      <BannerItem item={props.item} index={props.index} range={range} onTilePress={onTilePress} />
    ),
    [range, onTilePress],
  );

  return (
    <Box testID={testID} lx={{ marginBottom: "s24" }}>
      <Subheader testID="market-banner-title">
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
