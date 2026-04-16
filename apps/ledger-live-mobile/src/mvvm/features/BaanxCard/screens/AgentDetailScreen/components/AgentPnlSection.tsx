import React, { memo, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Polygon } from "react-native-svg";
import { Text, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

const CHART_WIDTH = 320;
const CHART_HEIGHT = 120;

interface Props {
  readonly pnlPercent: number;
  readonly pnlAbsolute: number;
  readonly pnlPeriod: string;
  readonly pnlIsPositive: boolean;
  readonly chartData: readonly number[];
}

function buildPath(
  data: readonly number[],
  width: number,
  height: number,
): string {
  if (data.length < 2) return "";
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pad = 4;
  const h = height - pad * 2;

  return data
    .map((v, i) => {
      const x = i * stepX;
      const y = pad + h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(
  data: readonly number[],
  width: number,
  height: number,
): string {
  const line = buildPath(data, width, height);
  if (!line) return "";
  return `${line} L${width},${height} L0,${height} Z`;
}

const AgentPnlSection = memo(function AgentPnlSection({
  pnlPercent,
  pnlAbsolute,
  pnlPeriod,
  pnlIsPositive,
  chartData,
}: Props) {
  const { theme } = useTheme();

  const strokeColor = pnlIsPositive
    ? theme.colors.text.success ?? "#47883a"
    : theme.colors.text.error ?? "#d9534f";

  const trianglePoints = pnlIsPositive ? "5,0 10,8 0,8" : "0,0 10,0 5,8";

  const linePath = useMemo(() => buildPath(chartData, CHART_WIDTH, CHART_HEIGHT), [chartData]);
  const areaPath = useMemo(() => buildAreaPath(chartData, CHART_WIDTH, CHART_HEIGHT), [chartData]);

  const absFormatted = `${pnlIsPositive ? "+" : ""}$${Math.abs(pnlAbsolute).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (chartData.length < 2 && pnlPercent === 0) return null;

  return (
    <View style={styles.section}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>Performance</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <View style={[styles.card, { backgroundColor: theme.colors.bg.surface }]}>
        <View style={styles.pnlHeader}>
          <View style={styles.pnlValues}>
            <Text typography="heading4SemiBold" style={{ color: strokeColor }}>
              {absFormatted}
            </Text>
            <View style={styles.pnlRow}>
              <Svg width={10} height={8} viewBox="0 0 10 8">
                <Polygon points={trianglePoints} fill={strokeColor} />
              </Svg>
              <Text typography="body3" style={{ color: strokeColor }}>
                {`${pnlIsPositive ? "+" : ""}${pnlPercent.toFixed(2)}%`}
              </Text>
              <Text typography="body3" lx={{ color: "muted" }}>
                {pnlPeriod}
              </Text>
            </View>
          </View>
        </View>

        {chartData.length >= 2 && (
          <View style={styles.chartContainer}>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={strokeColor} stopOpacity={0.2} />
                  <Stop offset="1" stopColor={strokeColor} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d={areaPath} fill="url(#pnlGrad)" />
              <Path
                d={linePath}
                stroke={strokeColor}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  pnlHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pnlValues: {
    gap: 4,
  },
  pnlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chartContainer: {
    alignItems: "center",
  },
});

export default AgentPnlSection;
