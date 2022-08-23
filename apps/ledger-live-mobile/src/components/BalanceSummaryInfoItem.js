import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Info from "../icons/Info";
import LText from "./LText";

type Props = {
  onPress: () => void,
  title: React$Node,
  value: React$Node,
  warning: ?boolean,
};

export default function BalanceSummaryInfoItem({
  onPress,
  title,
  value,
  warning = false,
}: Props) {
  const { colors } = useTheme();
  const warningStyle = warning && {
    color: colors.orange,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[warningStyle, styles.wrapper, { backgroundColor: colors.card }]}
    >
      <View style={[warningStyle, styles.balanceLabelContainer]}>
        <LText style={[warningStyle, styles.balanceLabel]}>{title}</LText>
        {onPress && (
          <Info size={12} color={warningStyle ? colors.orange : colors.grey} />
        )}
      </View>
      <LText semiBold style={[warningStyle, styles.balance]} color="grey">
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
