import React, { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "styled-components/native";
import { useTranslation } from "~/context/Locale";
import SafeAreaView from "~/components/SafeAreaView";
import getWindowDimensions from "~/logic/getWindowDimensions";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { EarnSimulatorNavigatorParamsList } from "../../types";
import useEarnSimulatorViewModel from "./useEarnSimulatorViewModel";
import SimulatorBarChart from "./components/SimulatorBarChart";
import ChartLegend from "./components/ChartLegend";
import DepositSlider from "./components/DepositSlider";
import CurrencyApySelector from "./components/CurrencyApySelector";

const { width: screenWidth } = getWindowDimensions();
const CHART_HORIZONTAL_PADDING = 24;
const CHART_WIDTH = screenWidth - CHART_HORIZONTAL_PADDING * 2;
const CHART_HEIGHT = 180;

type Props = StackNavigatorProps<EarnSimulatorNavigatorParamsList, ScreenName.EarnSimulator>;

const formatDollar = (value: number) =>
  `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const formatDollarCents = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function EarnSimulator({ route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const vm = useEarnSimulatorViewModel(route.params);

  const depositColor = colors.neutral.c50;
  const rewardsColor = colors.success.c60;

  const legendItems = useMemo(
    () => [
      { label: t("earn.simulator.rewards"), color: rewardsColor },
      { label: t("earn.simulator.deposits"), color: depositColor },
    ],
    [t, rewardsColor, depositColor],
  );

  const handleEarnPress = useCallback(() => {
    vm.onEarnPress();
  }, [vm]);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <CurrencyApySelector
          currencyName={vm.currencyName}
          apy={vm.apy}
          onPress={vm.onSelectCurrency}
        />

        <View style={styles.totalRewardsSection}>
          <Text variant="small" color="neutral.c70">
            {t("earn.simulator.totalRewards")}
          </Text>
          <Text variant="h1" fontWeight="semiBold" color="neutral.c100">
            {formatDollarCents(vm.totalRewards)}
          </Text>
        </View>

        <View style={styles.chartSection}>
          <ChartLegend items={legendItems} />
          <SimulatorBarChart
            data={vm.chartData}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            depositColor={depositColor}
            rewardsColor={rewardsColor}
          />
        </View>

        <View style={styles.slidersSection}>
          <DepositSlider
            label={t("earn.simulator.initialDeposit")}
            value={vm.initialDeposit}
            min={vm.initialDepositConfig.min}
            max={vm.initialDepositConfig.max}
            step={vm.initialDepositConfig.step}
            formatValue={formatDollar}
            onValueChange={vm.onInitialDepositChange}
          />
          <DepositSlider
            label={t("earn.simulator.monthlyDeposit")}
            value={vm.monthlyDeposit}
            min={vm.monthlyDepositConfig.min}
            max={vm.monthlyDepositConfig.max}
            step={vm.monthlyDepositConfig.step}
            formatValue={formatDollar}
            onValueChange={vm.onMonthlyDepositChange}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button appearance="base" size="lg" onPress={handleEarnPress}>
          {t("earn.simulator.earnCurrency", { currency: vm.currencyName })}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 24,
  },
  totalRewardsSection: {
    alignItems: "center",
    gap: 4,
  },
  chartSection: {
    gap: 12,
  },
  slidersSection: {
    gap: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
