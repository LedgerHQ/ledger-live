import React from "react";
import { RefreshControl, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { AccountDetailLayout } from "@features/flow-account-detail";
import { AccountEmptyState } from "@features/flow-account-detail-hero/native";
import { TrackScreen } from "@shared/analytics-react";
import { BottomFadeGradient, GRADIENT_HEIGHT } from "LLM/components/BottomFadeGradient";
import type { Account } from "@ledgerhq/types-live";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../testIds";
import { AssetsSection } from "./components/AssetsSection";
import { FamilySection } from "./components/FamilySection";
import { Hero } from "./components/Hero";
import { AccountRefreshStatus } from "./components/RefreshStatus";
import { Transactions } from "./components/Transactions";
import type { AccountRefresh } from "./useAccountRefresh";
import { useAccountDetailContentViewModel } from "./useAccountDetailContentViewModel";

type Props = Readonly<{ account: Account; refresh: AccountRefresh }>;

export function AccountDetailView({ account, refresh }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { colors, dark } = useTheme();
  const { hero, emptyState } = useAccountDetailContentViewModel(account);
  const showsEmptyState = emptyState.isVisible;

  return (
    <Box testID={ACCOUNT_DETAIL_TEST_IDS.screen} lx={screenStyle}>
      <TrackScreen
        category="Account"
        currency={account.currency.name}
        operationsSize={account.operations.length}
      />
      <ScrollView
        testID={ACCOUNT_DETAIL_TEST_IDS.scrollView}
        style={scrollStyle}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: GRADIENT_HEIGHT + bottom,
          ...(showsEmptyState ? { flexGrow: 1 } : {}),
        }}
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
        <Box lx={showsEmptyState ? filledContentStyle : contentStyle}>
          <AccountDetailLayout
            hero={<Hero {...hero} />}
            customPlace={<FamilySection account={account} />}
            assets={showsEmptyState ? null : <AssetsSection account={account} />}
            transactions={showsEmptyState ? null : <Transactions account={account} />}
          />
          {showsEmptyState ? (
            <Box testID={ACCOUNT_DETAIL_TEST_IDS.emptyStateSlot} lx={emptyStateSlotStyle}>
              <AccountEmptyState
                fundingActions={emptyState.fundingActions}
                testID={ACCOUNT_DETAIL_TEST_IDS.emptyState}
              />
            </Box>
          ) : null}
        </Box>
      </ScrollView>
      <BottomFadeGradient />
    </Box>
  );
}

const screenStyle: LumenViewStyle = { flex: 1, backgroundColor: "canvas" };
const scrollStyle = { flex: 1 };
const contentStyle: LumenViewStyle = { paddingHorizontal: "s16", paddingTop: "s4" };
const filledContentStyle: LumenViewStyle = {
  ...contentStyle,
  flexGrow: 1,
  gap: "s24",
};
const emptyStateSlotStyle: LumenViewStyle = { flexGrow: 1, justifyContent: "center" };
