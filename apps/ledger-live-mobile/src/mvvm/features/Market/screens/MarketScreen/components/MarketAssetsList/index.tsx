import React, { useCallback, type ReactNode } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banner,
  Box,
  Spinner,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import AssetListItem, {
  AssetLoadingState,
  type MarketAssetDisplayData,
} from "LLM/components/AssetListItem";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";

const HORIZONTAL_PADDING = 16;
const SKELETON_COUNT = 3;

function MarketAssetsEmptyState({
  loading,
  error,
}: Readonly<{ loading: boolean; error: boolean }>) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <AssetLoadingState
        count={SKELETON_COUNT}
        lx={rowStyle}
        skeletonTestID={MARKET_SCREEN_TEST_IDS.assetsSkeleton}
      />
    );
  }

  if (error) {
    return (
      <Banner
        appearance="error"
        title={t("market.assets.error.title")}
        description={t("market.assets.error.description")}
        testID={MARKET_SCREEN_TEST_IDS.assetsError}
      />
    );
  }

  return null;
}

type Props = Readonly<{
  assets: MarketAssetDisplayData[];
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  onAssetPress: (asset: MarketAssetDisplayData) => void;
  onEndReached: () => void;
  header: ReactNode;
}>;

export function MarketAssetsList({
  assets,
  loading,
  loadingMore,
  error,
  onAssetPress,
  onEndReached,
  header,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const { t } = useTranslation();

  const renderRow = useCallback(
    ({ item }: ListRenderItemInfo<MarketAssetDisplayData>) => (
      <AssetListItem variant="market" market={item} onPress={onAssetPress} lx={rowStyle} />
    ),
    [onAssetPress],
  );

  const listHeader = (
    <Box lx={headerStyle}>
      {header}
      <Subheader lx={subHeaderStyle} testID={MARKET_SCREEN_TEST_IDS.assetsSubHeader}>
        <SubheaderRow>
          <SubheaderTitle>{t("market.assets.title")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
    </Box>
  );

  const listFooter = loadingMore ? (
    <Spinner
      size={24}
      color="base"
      lx={footerSpinnerStyle}
      testID={MARKET_SCREEN_TEST_IDS.assetsFooterSpinner}
    />
  ) : null;

  return (
    <>
      <FlatList
        testID={MARKET_SCREEN_TEST_IDS.list}
        data={assets}
        keyExtractor={item => item.id}
        renderItem={renderRow}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<MarketAssetsEmptyState loading={loading} error={error} />}
        ListFooterComponent={listFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingBottom: GRADIENT_HEIGHT + bottom,
        }}
      />
      {assets.length > 0 && <BottomFadeGradient />}
    </>
  );
}

const headerStyle: LumenViewStyle = {
  marginHorizontal: "-s16",
  paddingTop: "s24",
  gap: "s24",
};

const subHeaderStyle: LumenViewStyle = {
  marginHorizontal: "s16",
  marginBottom: "s12",
};

const rowStyle: LumenViewStyle = {
  marginHorizontal: "-s8",
};

const footerSpinnerStyle: LumenViewStyle = {
  marginVertical: "s24",
  alignSelf: "center",
};
