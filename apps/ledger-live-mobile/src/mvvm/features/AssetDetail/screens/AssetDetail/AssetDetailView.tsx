import React from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TrackScreen } from "~/analytics";
import { ASSET_DETAIL_TEST_IDS } from "../../testIds";
import { SectionPlaceholder } from "./components/SectionPlaceholder";
import { Footer } from "./components/Footer";
import { CTAS_HEIGHT, SECTION_HEIGHT, PLACEHOLDER_COLORS } from "./utils/constants";

type Props = Readonly<{
  currency: CryptoCurrency | undefined;
  source?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}>;

export function AssetDetailView({ currency, source, isRefreshing, onRefresh }: Props) {
  const { bottom } = useSafeAreaInsets();

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.screen} lx={screenStyle}>
      <TrackScreen category="Asset" currency={currency?.name} source={source} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: CTAS_HEIGHT + bottom }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Box lx={contentStyle}>
          <SectionPlaceholder
            testID={ASSET_DETAIL_TEST_IDS.balanceGraph}
            backgroundColor={PLACEHOLDER_COLORS.balanceGraph}
            height={SECTION_HEIGHT}
          />
          <SectionPlaceholder
            testID={ASSET_DETAIL_TEST_IDS.balanceDetails}
            backgroundColor={PLACEHOLDER_COLORS.balanceDetails}
            height={SECTION_HEIGHT}
          />
          <SectionPlaceholder
            testID={ASSET_DETAIL_TEST_IDS.addresses}
            backgroundColor={PLACEHOLDER_COLORS.addresses}
            height={SECTION_HEIGHT}
          />
          <SectionPlaceholder
            testID={ASSET_DETAIL_TEST_IDS.marketStats}
            backgroundColor={PLACEHOLDER_COLORS.marketStats}
            height={SECTION_HEIGHT}
          />
          <SectionPlaceholder
            testID={ASSET_DETAIL_TEST_IDS.transactions}
            backgroundColor={PLACEHOLDER_COLORS.transactions}
            height={SECTION_HEIGHT}
          />
        </Box>
      </ScrollView>
      <Footer />
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
