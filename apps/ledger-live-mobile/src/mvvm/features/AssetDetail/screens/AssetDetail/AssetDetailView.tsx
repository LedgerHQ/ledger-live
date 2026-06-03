import React, { useMemo } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { DistributionItem } from "@ledgerhq/types-live";
import { TrackScreen } from "~/analytics";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { TransferDrawer } from "LLM/features/QuickActions";
import { ASSET_DETAIL_TEST_IDS } from "../../testIds";
import { BalanceGraph } from "./components/BalanceGraph";
import { BalanceDetails } from "./components/BalanceDetails";
import { Addresses } from "./components/Addresses";
import { Transactions } from "./components/Transactions";
import { Footer } from "./components/Footer";
import { FallbackBanner } from "./components/FallbackBanner";
import { HiddenAssetBanner } from "./components/HiddenAssetBanner";
import { MarketData } from "./components/MarketData";
import { CTAS_HEIGHT } from "./utils/constants";
import { AssetCoinOptionsSheetView } from "./components/CoinOptions/AssetCoinOptionsSheetView";
import type { AssetCoinOptionsViewModel } from "./components/CoinOptions/useAssetCoinOptionsViewModel";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  distributionItem: DistributionItem | undefined;
  marketApiId?: string;
  knownLedgerIds?: readonly string[];
  knownMarketId?: string;
  source?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  hasFooter: boolean;
  hideReceiveInBalanceGraph: boolean;
  showFallbackBanner: boolean;
  coinOptions: AssetCoinOptionsViewModel;
  isLoading: boolean;
  ledgerIds: string[];
}>;

export function AssetDetailView({
  currency,
  distributionItem,
  marketApiId,
  knownLedgerIds,
  knownMarketId,
  source,
  isRefreshing,
  onRefresh,
  hasFooter,
  hideReceiveInBalanceGraph,
  showFallbackBanner,
  coinOptions,
  isLoading,
  ledgerIds,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const scrollPaddingBottom = useMemo(
    () => (hasFooter ? CTAS_HEIGHT + bottom : bottom),
    [hasFooter, bottom],
  );

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.screen} lx={screenStyle}>
      <TrackScreen category="Asset" currency={currency?.name} source={source} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollPaddingBottom }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Box lx={contentStyle}>
          <HiddenAssetBanner show={coinOptions.isHidden} onShowAsset={coinOptions.onShowAsset} />
          <BalanceGraph
            currency={currency}
            distributionItem={distributionItem}
            marketApiId={marketApiId}
            knownLedgerIds={knownLedgerIds}
            knownMarketId={knownMarketId}
            hideReceive={hideReceiveInBalanceGraph}
            ledgerIds={ledgerIds}
          />
          <BalanceDetails
            currency={currency}
            distributionItem={distributionItem}
            isLoading={isLoading}
          />
          <Addresses
            currency={currency}
            distributionItem={distributionItem}
            isLoading={isLoading}
          />
          <MarketData
            currency={currency}
            marketApiId={marketApiId}
            knownLedgerIds={knownLedgerIds}
            knownMarketId={knownMarketId}
          />
          <Transactions
            currency={currency}
            distributionItem={distributionItem}
            isLoading={isLoading}
          />
          <FallbackBanner show={showFallbackBanner} />
        </Box>
      </ScrollView>
      <Footer currency={currency} ledgerIds={ledgerIds} />
      <TransferDrawer currency={currency} ledgerIds={ledgerIds} />
      <AssetCoinOptionsSheetView
        isOpen={coinOptions.isCoinOptionsSheetOpen}
        onClose={coinOptions.closeCoinOptions}
        isHidden={coinOptions.isHidden}
        isStarred={coinOptions.isStarred}
        onToggleFavourite={coinOptions.onToggleFavourite}
        onToggleHideFromPortfolio={coinOptions.onToggleHideFromPortfolio}
      />
    </Box>
  );
}

const screenStyle: LumenViewStyle = {
  flex: 1,
};

const contentStyle: LumenViewStyle = {
  padding: "s16",
  gap: "s24",
};
