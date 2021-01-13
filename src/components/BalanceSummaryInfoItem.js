import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Info from "../icons/Info";
import LText from "./LText";

type Props = {
  onPress: () => void,
  title: React$Node,
  value: React$Node,
};

export default function BalanceSummaryInfoItem({
  onPress,
  title,
  value,
}: Props) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.wrapper, { backgroundColor: colors.card }]}
    >
      <View style={styles.balanceLabelContainer}>
        <LText style={styles.balanceLabel}>{title}</LText>
        {onPress && <Info size={12} color={colors.grey} />}
      </View>
      <LText semiBold style={styles.balance} color="grey">
        {value}
      </LText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexBasis: "auto",
    flexDirection: "column",
    marginRight: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  balanceLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    lineHeight: 16,
    marginRight: 6,
  },
  balance: {
    fontSize: 18,
    lineHeight: 22,
  },
});
