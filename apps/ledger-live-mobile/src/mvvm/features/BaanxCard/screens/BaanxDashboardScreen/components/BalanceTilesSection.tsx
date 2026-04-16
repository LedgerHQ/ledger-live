import React, { memo, useMemo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import Svg, { Path, Polygon } from "react-native-svg";
import { useTranslation } from "~/context/Locale";
import { IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

const DISCREET_PLACEHOLDER = "••••";

interface Props {
  readonly totalBalanceValue: number;
  readonly isBalanceLoading?: boolean;
  readonly isTransactionsLoading?: boolean;
  readonly cashbackDisplay: string;
  readonly cashbackRate: number;
  readonly spentThisMonthValue: number;
  readonly spentTrend: number | null;
  readonly spentChartData: readonly number[];
  readonly fiatCurrencySymbol: string;
  readonly discreetMode: boolean;
  readonly onToggleDiscreet: () => void;
  readonly onTopUp: () => void;
}

function formatFiat(value: number, symbol: string): { integer: string; decimal: string } {
  const [int, dec] = value.toFixed(2).split(".");
  return { integer: `${symbol}${int}`, decimal: `.${dec}` };
}

function FiatAmount({
  value,
  symbol,
  hidden,
  loading,
}: {
  value: number;
  symbol: string;
  hidden: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Text typography="heading5SemiBold" lx={{ color: "muted" }}>
        —
      </Text>
    );
  }
  if (hidden) {
    return (
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {DISCREET_PLACEHOLDER}
      </Text>
    );
  }
  const { integer, decimal } = formatFiat(value, symbol);
  return (
    <Text typography="heading5SemiBold" lx={{ color: "base" }}>
      {integer}
      <Text typography="body2SemiBold" lx={{ color: "muted" }}>
        {decimal}
      </Text>
    </Text>
  );
}

function CryptoAmount({
  display,
  hidden,
  loading,
}: {
  display: string;
  hidden: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Text typography="heading5SemiBold" lx={{ color: "muted" }}>
        —
      </Text>
    );
  }
  if (hidden) {
    return (
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {DISCREET_PLACEHOLDER}
      </Text>
    );
  }
  const spaceIdx = display.indexOf(" ");
  const amount = spaceIdx > -1 ? display.slice(0, spaceIdx) : display;
  const currency = spaceIdx > -1 ? ` ${display.slice(spaceIdx + 1)}` : "";
  const dotIdx = amount.indexOf(".");
  const intPart = dotIdx > -1 ? amount.slice(0, dotIdx) : amount;
  const decPart = dotIdx > -1 ? amount.slice(dotIdx) : "";
  return (
    <Text typography="heading5SemiBold" lx={{ color: "base" }}>
      {intPart}
      <Text typography="body2SemiBold" lx={{ color: "muted" }}>
        {decPart}
        {currency}
      </Text>
    </Text>
  );
}

function SparkLine({
  data,
  width,
  height,
  color,
}: {
  data: readonly number[];
  width: number;
  height: number;
  color: string;
}) {
  const d = useMemo(() => {
    if (data.length < 2) return "";
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const padding = 2;
    const chartH = height - padding * 2;

    return data
      .map((v, i) => {
        const x = i * stepX;
        const y = padding + chartH - ((v - min) / range) * chartH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data, width, height]);

  if (!d) return null;

  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function TrendBadge({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.trendRow}>
      <Svg width={10} height={8} viewBox="0 0 10 8">
        <Polygon points="5,0 10,8 0,8" fill={color} />
      </Svg>
      <Text typography="body3" style={{ color }}>
        {`${value.toFixed(2)}%`}
      </Text>
    </View>
  );
}

const BalanceTilesSection = memo(function BalanceTilesSection({
  totalBalanceValue,
  isBalanceLoading,
  isTransactionsLoading,
  cashbackDisplay,
  cashbackRate,
  spentThisMonthValue,
  spentTrend,
  spentChartData,
  fiatCurrencySymbol,
  discreetMode,
  onToggleDiscreet,
  onTopUp,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const tileBg = theme.colors.bg.surface;
  const successColor = theme.colors.text.success ?? "#47883a";

  return (
    <View style={styles.row}>
      <View style={styles.leftColumn}>
        <Pressable
          style={[styles.balanceTile, { backgroundColor: tileBg }]}
          onPress={onToggleDiscreet}
        >
          <View style={styles.tileText}>
            <FiatAmount
              value={totalBalanceValue}
              symbol={fiatCurrencySymbol}
              hidden={discreetMode}
              loading={isBalanceLoading}
            />
            <Text typography="body3" lx={{ color: "muted" }}>
              {t("baanxCard.dashboard.balance.totalBalance")}
            </Text>
          </View>
          <IconButton
            appearance="transparent"
            size="sm"
            icon={Plus}
            onPress={onTopUp}
            accessibilityLabel={t("baanxCard.dashboard.balance.totalBalance")}
          />
        </Pressable>

        <View style={[styles.cashbackTile, { backgroundColor: tileBg }]}>
          <CryptoAmount
            display={cashbackDisplay}
            hidden={discreetMode}
            loading={isTransactionsLoading}
          />
          <Text typography="body3" lx={{ color: "muted" }}>
            {t("baanxCard.dashboard.balance.cashback", { rate: cashbackRate })}
          </Text>
        </View>
      </View>

      <View style={[styles.spentTile, { backgroundColor: tileBg }]}>
        <View style={styles.spentHeader}>
          <View style={styles.spentAmountRow}>
            <FiatAmount
              value={spentThisMonthValue}
              symbol={fiatCurrencySymbol}
              hidden={discreetMode}
              loading={isTransactionsLoading}
            />
            {spentTrend !== null && !discreetMode && (
              <TrendBadge value={spentTrend} color={successColor} />
            )}
          </View>
          <Text typography="body3" lx={{ color: "muted" }}>
            {t("baanxCard.dashboard.balance.spentThisMonth")}
          </Text>
        </View>

        {spentChartData.length > 1 && !discreetMode && (
          <View style={styles.chartContainer}>
            <SparkLine data={spentChartData} width={141} height={60} color={successColor} />
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  leftColumn: {
    flex: 1,
    gap: 12,
  },
  balanceTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
  },
  tileText: {
    flex: 1,
    gap: 0,
  },
  cashbackTile: {
    borderRadius: 12,
    padding: 12,
    gap: 0,
  },
  spentTile: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: "space-between",
  },
  spentHeader: {
    gap: 0,
  },
  spentAmountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  chartContainer: {
    alignSelf: "flex-start",
  },
});

export default BalanceTilesSection;
