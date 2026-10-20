import React from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { AccountDetailLayout } from "@features/flow-account-detail";
import { TrackScreen } from "@shared/analytics-react";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";
import type { Account } from "@ledgerhq/types-live";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../testIds";
import { AssetsSection } from "./components/AssetsSection";
import { AccountRefreshStatus } from "./components/RefreshStatus";
import { Transactions } from "./components/Transactions";
import type { AccountRefresh } from "./useAccountRefresh";

type Props = Readonly<{ account: Account; refresh: AccountRefresh }>;

export function AccountDetailView({ account, refresh }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { colors, dark } = useTheme();

  return (
    <Box testID={ACCOUNT_DETAIL_TEST_IDS.screen} lx={screenStyle}>
      <TrackScreen
        category="Account"
        currency={account.currency.name}
        operationsSize={account.operations.length}
      />
      <ScrollView
        testID={ACCOUNT_DETAIL_TEST_IDS.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: GRADIENT_HEIGHT + bottom }}
        refreshControl={
          <RefreshControl
            progressBackgroundColor={dark ? colors.background : colors.card}
            colors={["transparent"]}
            tintColor="transparent"
            refreshing={false}
            onRefresh={refresh.onRefresh}
          />
        }
      >
        <AccountRefreshStatus
          accountId={account.id}
          lastClickTimestamp={refresh.lastClickTimestamp}
          lastOfflineAttemptTimestamp={refresh.lastOfflineAttemptTimestamp}
        />
        <Box lx={contentStyle}>
          <AccountDetailLayout
            hero={<Box testID={ACCOUNT_DETAIL_TEST_IDS.hero} lx={heroStyle} />}
            customPlace={<Box testID={ACCOUNT_DETAIL_TEST_IDS.customPlace} lx={customPlaceStyle} />}
            assets={<AssetsSection account={account} />}
            transactions={<Transactions account={account} />}
          />
        </Box>
      </ScrollView>
      <BottomFadeGradient />
    </Box>
  );
}

const screenStyle: LumenViewStyle = { flex: 1, backgroundColor: "canvas" };
const contentStyle: LumenViewStyle = { padding: "s16" };
const sectionStyle: LumenViewStyle = { borderRadius: "md", padding: "s48" };
const heroStyle: LumenViewStyle = { ...sectionStyle, backgroundColor: "error" };
const customPlaceStyle: LumenViewStyle = {
  ...sectionStyle,
  padding: "s32",
  backgroundColor: "warning",
};
