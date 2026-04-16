import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

interface Props {
  readonly balanceInteger: string;
  readonly balanceDecimal: string;
  readonly pnlPercent: number;
  readonly pnlPeriod: string;
  readonly pnlIsPositive: boolean;
}

const AgentBalanceSection = memo(function AgentBalanceSection({
  balanceInteger,
  balanceDecimal,
  pnlPercent,
  pnlPeriod,
  pnlIsPositive,
}: Props) {
  const { theme } = useTheme();
  const pnlColor = pnlIsPositive
    ? theme.colors.text.success ?? "#47883a"
    : theme.colors.text.error ?? "#d9534f";

  const trianglePoints = pnlIsPositive ? "5,0 10,8 0,8" : "0,0 10,0 5,8";

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg.surface }]}>
      <Text typography="body3" lx={{ color: "muted" }}>
        Live Balance
      </Text>

      <Text typography="heading2SemiBold" lx={{ color: "base" }}>
        {balanceInteger}
        <Text typography="heading4SemiBold" lx={{ color: "muted" }}>
          {balanceDecimal}
        </Text>
      </Text>

      {pnlPercent !== 0 && (
        <View style={styles.pnlRow}>
          <Svg width={10} height={8} viewBox="0 0 10 8">
            <Polygon points={trianglePoints} fill={pnlColor} />
          </Svg>
          <Text typography="body3" style={{ color: pnlColor }}>
            {`${pnlIsPositive ? "+" : ""}${pnlPercent.toFixed(2)}%`}
          </Text>
          <Text typography="body3" lx={{ color: "muted" }}>
            {pnlPeriod}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  pnlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
});

export default AgentBalanceSection;
