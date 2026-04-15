import React, { memo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useTranslation } from "~/context/Locale";
import { IconButton, Text } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

const DISCREET_PLACEHOLDER = "••••";

const LOADING_PLACEHOLDER = "—";

interface Props {
  readonly totalBalance: string;
  readonly isBalanceLoading?: boolean;
  readonly cashback: string;
  readonly discreetMode: boolean;
  readonly onToggleDiscreet: () => void;
  readonly onTopUp: () => void;
}

const BalanceTilesSection = memo(function BalanceTilesSection({
  totalBalance,
  isBalanceLoading,
  cashback,
  discreetMode,
  onToggleDiscreet,
  onTopUp,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const tileBg = theme.colors.bg.surface;

  const displayBalance = isBalanceLoading
    ? LOADING_PLACEHOLDER
    : discreetMode
      ? DISCREET_PLACEHOLDER
      : totalBalance;

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.balanceTile, { backgroundColor: tileBg }]}
        onPress={onToggleDiscreet}
      >
        <View style={styles.tileText}>
          <Text typography="heading5SemiBold" lx={{ color: isBalanceLoading ? "muted" : "base" }}>
            {displayBalance}
          </Text>
          <Text typography="body3" lx={{ color: "muted" }}>
            {t("baanxCard.dashboard.balance.totalBalance")}
          </Text>
        </View>
        <IconButton
          appearance="transparent"
          size="md"
          icon={Plus}
          onPress={onTopUp}
          accessibilityLabel={t("baanxCard.dashboard.balance.totalBalance")}
        />
      </Pressable>

      <View style={[styles.cashbackTile, { backgroundColor: tileBg }]}>
        <Text typography="heading5SemiBold" lx={{ color: "base" }}>
          {discreetMode ? DISCREET_PLACEHOLDER : cashback}
        </Text>
        <Text typography="body3" lx={{ color: "muted" }}>
          {t("baanxCard.dashboard.balance.cashback")}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
  },
  balanceTile: {
    flex: 1,
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
    width: 130,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 0,
  },
});

export default BalanceTilesSection;
