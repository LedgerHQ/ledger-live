import React, { useMemo } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "~/analytics";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { ASSET_DETAIL_TEST_IDS } from "../../testIds";
import { BalanceGraph } from "./components/BalanceGraph";
import { BalanceDetails } from "./components/BalanceDetails";
import { Addresses } from "./components/Addresses";
import { Transactions } from "./components/Transactions";
import { Footer } from "./components/Footer";
import { FallbackBanner } from "./components/FallbackBanner";
import { MarketData } from "./components/MarketData";
import { CTAS_HEIGHT } from "./utils/constants";

type Props = Readonly<{
  currency: AssetDetailCurrencyProps;
  source?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  hasFooter: boolean;
  hideReceiveInBalanceGraph: boolean;
  showFallbackBanner: boolean;
}>;

export function AssetDetailView({
  currency,
  source,
  isRefreshing,
  onRefresh,
  hasFooter,
  hideReceiveInBalanceGraph,
  showFallbackBanner,
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
          <BalanceGraph currency={currency} hideReceive={hideReceiveInBalanceGraph} />
          <BalanceDetails currency={currency} />
          <Addresses currency={currency} />
          <MarketData currency={currency} />
          <Transactions currency={currency} />
          <FallbackBanner show={showFallbackBanner} />
        </Box>
      </ScrollView>
      <Footer currency={currency} />
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
