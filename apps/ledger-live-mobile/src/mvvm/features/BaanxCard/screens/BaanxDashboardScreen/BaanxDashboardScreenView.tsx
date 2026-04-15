import React, { memo, useMemo } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { TrackScreen } from "~/analytics";
import CardSection from "./components/CardSection";
import BalanceTilesSection from "./components/BalanceTilesSection";
import PayWithSection from "./components/PayWithSection";
import TransactionsSection from "./components/TransactionsSection";
import type { BaanxDashboardViewModel } from "./useBaanxDashboardViewModel";

const BaanxDashboardScreenView = ({
  selectedCurrency,
  card,
  totalBalance,
  cashback,
  discreetMode,
  onToggleDiscreet,
  onTopUp,
  selectedPaymentId,
  stablecoins,
  onSelectPayment,
  isSmartPaySheetOpen,
  onCloseSmartPaySheet,
  transactions,
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
        <CardSection card={card} selectedCurrency={selectedCurrency} />

        <BalanceTilesSection
          totalBalance={totalBalance}
          cashback={cashback}
          discreetMode={discreetMode}
          onToggleDiscreet={onToggleDiscreet}
          onTopUp={onTopUp}
        />

        <PayWithSection
          selectedPaymentId={selectedPaymentId}
          stablecoins={stablecoins}
          onSelectPayment={onSelectPayment}
          isSmartPaySheetOpen={isSmartPaySheetOpen}
          onCloseSmartPaySheet={onCloseSmartPaySheet}
        />

        <TransactionsSection transactions={transactions} />
      </ScrollView>
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
