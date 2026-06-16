import React from "react";
import { Banner, Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { Search, StarFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { AssetLoadingState } from "LLM/components/AssetListItem";
import { MARKET_SCREEN_TEST_IDS } from "../../testIds";

const SKELETON_COUNT = 3;

type Props = Readonly<{
  loading: boolean;
  error: boolean;
  emptyState: "favorites" | "stocks" | undefined;
  showEmptySearchState: boolean;
}>;

export function MarketAssetsEmptyState({
  loading,
  error,
  emptyState,
  showEmptySearchState,
}: Props) {
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

  if (emptyState === "favorites") {
    return (
      <Box lx={emptyStateStyle} style={emptyStateSize}>
        <Spot
          appearance="icon"
          icon={StarFill}
          size={72}
          testID={MARKET_SCREEN_TEST_IDS.assetsFavoritesEmptyIcon}
        />
        <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("market.assets.emptyFavorites")}
        </Text>
      </Box>
    );
  }

  if (emptyState === "stocks") {
    return (
      <Box
        lx={emptyStateStyle}
        style={emptyStateSize}
        testID={MARKET_SCREEN_TEST_IDS.assetsStocksEmpty}
      >
        <Spot appearance="icon" icon={Search} size={72} />
        <Text typography="heading5SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("market.assets.emptyStocks")}
        </Text>
      </Box>
    );
  }

  if (showEmptySearchState) {
    return (
      <Box
        lx={emptyStateStyle}
        style={emptyStateSize}
        testID={MARKET_SCREEN_TEST_IDS.assetsEmptySearch}
      >
        <Spot appearance="icon" icon={Search} size={72} />
        <Text typography="heading4SemiBold" lx={{ textAlign: "center", color: "base" }}>
          {t("modularDrawer.emptyAssetList")}
        </Text>
      </Box>
    );
  }

  return null;
}

const skeletonStyle: LumenViewStyle = {
  marginHorizontal: "-s8",
  paddingHorizontal: "s8",
};

const emptyStateStyle: LumenViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: "s24",
};

const emptyStateSize = { minHeight: 328 };
