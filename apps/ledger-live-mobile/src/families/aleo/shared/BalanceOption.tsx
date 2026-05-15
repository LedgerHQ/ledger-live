import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";

type BalanceOptionProps = {
  label: string;
  balance: BigNumber;
  unit: Unit;
  selected: boolean;
  onPress: () => void;
  lastSyncDate?: Date;
};

export function BalanceOption({
  label,
  balance,
  unit,
  selected,
  onPress,
  lastSyncDate,
}: BalanceOptionProps) {
  const { colors } = useTheme();

  const formattedBalance = formatCurrencyUnit(unit, balance, {
    showCode: true,
    disableRounding: false,
  });

  const formattedDate = lastSyncDate
    ? new Date(lastSyncDate).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label} balance: ${formattedBalance}`}
      accessibilityState={{ selected }}
    >
      <Flex flexDirection="column" alignItems="flex-start" padding={4}>
        <Text
          variant="body"
          fontWeight="semiBold"
          color={selected ? "background" : "neutral.c100"}
          mb={2}
        >
          {label}
        </Text>
        <Text
          variant="h4"
          fontWeight="semiBold"
          color={selected ? "background" : "neutral.c100"}
          mb={1}
        >
          {formattedBalance}
        </Text>
        {formattedDate && (
          <Text variant="small" color={selected ? "background" : "neutral.c70"}>
            Last synced: {formattedDate}
          </Text>
        )}
      </Flex>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 8,
    minHeight: 100,
    flex: 1,
  },
});
