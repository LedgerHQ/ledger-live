import React, { memo, useMemo } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "~/analytics";
import CardSection from "./components/CardSection";
import BalanceTilesSection from "./components/BalanceTilesSection";
import PayWithSection from "./components/PayWithSection";
import TransactionsSection from "./components/TransactionsSection";
import SettingsBottomSheet from "./components/SettingsBottomSheet";
import TransactionDetailBottomSheet from "./components/TransactionDetailBottomSheet";
import type { BaanxDashboardViewModel } from "./useBaanxDashboardViewModel";

const BaanxDashboardScreenView = ({
  selectedCurrency,
  cards,
  activeCardIndex,
  onCardIndexChange,
  totalBalanceValue,
  isBalanceLoading,
  cashbackValue,
  cashbackRate,
  spentThisMonthValue,
  spentTrend,
  spentChartData,
  fiatCurrencySymbol,
  discreetMode,
  onToggleDiscreet,
  onTopUp,
  selectedPaymentId,
  stablecoins,
  onSelectPayment,
  onReorderStablecoins,
  isSmartPaySheetOpen,
  onOpenSmartPaySheet,
  onCloseSmartPaySheet,
  transactions,
  isTransactionsLoading,
  selectedTransaction,
  isTransactionDetailOpen,
  onSelectTransaction,
  onCloseTransactionDetail,
  frozenCardIds,
  blockedCardIds,
  isActiveCardFrozen,
  isActiveCardBlocked,
  isSettingsSheetOpen,
  onOpenSettingsSheet,
  onCloseSettingsSheet,
  onFreezeCard,
  onBlockCard,
  onCustomizeCard,
}: Readonly<BaanxDashboardViewModel>) => {
  const { theme } = useTheme();
  const bgColor = theme.colors.bg.base;
  const insets = useSafeAreaInsets();

  const scrollContentStyle = useMemo(
    () => [
      styles.container,
      {
        paddingTop: insets.top + 72,
        paddingBottom: insets.bottom + 56,
      },
    ],
    [insets.top, insets.bottom],
  );

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <TrackScreen name="BaanxCardDashboard" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={scrollContentStyle}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={Platform.OS === "android"}
        showsVerticalScrollIndicator={false}
      >
        <CardSection
          cards={cards}
          activeCardIndex={activeCardIndex}
          onCardIndexChange={onCardIndexChange}
          selectedCurrency={selectedCurrency}
          onOpenSettings={onOpenSettingsSheet}
          frozenCardIds={frozenCardIds}
          blockedCardIds={blockedCardIds}
        />

        <BalanceTilesSection
          totalBalanceValue={totalBalanceValue}
          isBalanceLoading={isBalanceLoading}
          cashbackValue={cashbackValue}
          cashbackRate={cashbackRate}
          spentThisMonthValue={spentThisMonthValue}
          spentTrend={spentTrend}
          spentChartData={spentChartData}
          fiatCurrencySymbol={fiatCurrencySymbol}
          discreetMode={discreetMode}
          onToggleDiscreet={onToggleDiscreet}
          onTopUp={onTopUp}
        />

        <PayWithSection
          selectedPaymentId={selectedPaymentId}
          stablecoins={stablecoins}
          onSelectPayment={onSelectPayment}
          onReorderStablecoins={onReorderStablecoins}
          isSmartPaySheetOpen={isSmartPaySheetOpen}
          onOpenSmartPaySheet={onOpenSmartPaySheet}
          onCloseSmartPaySheet={onCloseSmartPaySheet}
        />

        <TransactionsSection
          transactions={transactions}
          isLoading={isTransactionsLoading}
          onSelectTransaction={onSelectTransaction}
        />
      </ScrollView>

      <SettingsBottomSheet
        isOpen={isSettingsSheetOpen}
        onClose={onCloseSettingsSheet}
        isCardFrozen={isActiveCardFrozen}
        isCardBlocked={isActiveCardBlocked}
        onFreezeCard={onFreezeCard}
        onBlockCard={onBlockCard}
        onCustomizeCard={onCustomizeCard}
      />

      <TransactionDetailBottomSheet
        transaction={selectedTransaction}
        isOpen={isTransactionDetailOpen}
        onClose={onCloseTransactionDetail}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
});

export default memo(BaanxDashboardScreenView);
