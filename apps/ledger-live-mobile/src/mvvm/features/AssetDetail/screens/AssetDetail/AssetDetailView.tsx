import React, { useMemo } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TrackScreen } from "~/analytics";
import { ASSET_DETAIL_TEST_IDS } from "../../testIds";
import { BalanceGraph } from "./components/BalanceGraph";
import { BalanceDetails } from "./components/BalanceDetails";
import { Addresses } from "./components/Addresses";
import { Transactions } from "./components/Transactions";
import { Footer } from "./components/Footer";
import { MarketData } from "./components/MarketData";
import { useIsBuyAvailable } from "./components/Footer/useFooterViewModel";
import { CTAS_HEIGHT } from "./utils/constants";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
  source?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}>;

export function AssetDetailView({ currency, source, isRefreshing, onRefresh }: Props) {
  const { bottom } = useSafeAreaInsets();
  const hasFooter = useIsBuyAvailable(currency);
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
          <BalanceGraph currency={currency} />
          <BalanceDetails currency={currency} />
          <Addresses currency={currency} />
          <MarketData currency={currency} />
          <Transactions currency={currency} />
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
