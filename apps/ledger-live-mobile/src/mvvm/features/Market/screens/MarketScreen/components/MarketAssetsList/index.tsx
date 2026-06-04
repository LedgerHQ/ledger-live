import React, { useCallback, type ReactNode } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Banner,
  Box,
  Spinner,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Search } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import AssetListItem, {
  AssetLoadingState,
  type MarketAssetDisplayData,
} from "LLM/components/AssetListItem";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";

const HORIZONTAL_PADDING = 16;
const TOP_PADDING = 24;
const SKELETON_COUNT = 3;

function MarketAssetsEmptyState({
  loading,
  error,
  showEmptySearchState,
}: Readonly<{ loading: boolean; error: boolean; showEmptySearchState: boolean }>) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <AssetLoadingState
        count={SKELETON_COUNT}
        lx={skeletonStyle}
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

  if (showEmptySearchState) {
    return (
      <Box
        lx={emptySearchStateStyle}
        style={emptySearchStateSize}
        testID={MARKET_SCREEN_TEST_IDS.assetsEmptySearch}
      >
        <Spot appearance="icon" icon={Search} size={72} />
        <Text typography="heading4SemiBold" lx={{ textAlign: "center", color: "base" }}>
          {t("market.assets.emptySearch")}
        </Text>
      </Box>
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
  showSubheader: boolean;
  header?: ReactNode;
}>;

export function MarketAssetsList({
  assets,
  loading,
  loadingMore,
  error,
  onAssetPress,
  onEndReached,
  showSubheader,
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

  const listHeader =
    header || showSubheader ? (
      <Box lx={headerStyle}>
        {header}
        {showSubheader ? (
          <Subheader lx={subHeaderStyle} testID={MARKET_SCREEN_TEST_IDS.assetsSubHeader}>
            <SubheaderRow>
              <SubheaderTitle>{t("market.assets.title")}</SubheaderTitle>
            </SubheaderRow>
          </Subheader>
        ) : null}
      </Box>
    ) : null;

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
        ListEmptyComponent={
          <MarketAssetsEmptyState
            loading={loading}
            error={error}
            showEmptySearchState={!showSubheader}
          />
        }
        ListFooterComponent={listFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        contentContainerStyle={{
          flexGrow: assets.length === 0 ? 1 : undefined,
          paddingTop: listHeader ? 0 : TOP_PADDING,
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

const skeletonStyle: LumenViewStyle = {
  marginHorizontal: "-s8",
  paddingHorizontal: "s8",
};

const footerSpinnerStyle: LumenViewStyle = {
  marginVertical: "s24",
  alignSelf: "center",
};

const emptySearchStateStyle: LumenViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: "s24",
};

const emptySearchStateSize = { minHeight: 328 };
