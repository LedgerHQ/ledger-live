import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../colors";
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
  return (
    <TouchableOpacity onPress={onPress} style={styles.wrapper}>
      <View style={styles.balanceLabelContainer}>
        <LText style={styles.balanceLabel}>{title}</LText>
        <Info size={12} color={colors.grey} />
      </View>
      <LText semiBold style={styles.balance}>
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
    backgroundColor: colors.lightGrey,
  },
  balanceLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: colors.grey,
    marginRight: 6,
  },
  balance: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.darkBlue,
  },
});
