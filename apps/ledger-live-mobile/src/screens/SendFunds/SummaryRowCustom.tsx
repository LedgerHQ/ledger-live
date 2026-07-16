import React from "react";
import { StyleSheet, View } from "react-native";
import LText from "~/components/LText/index";

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  labelStyle: {
    fontSize: 16,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconLeft: {
    paddingRight: 16,
  },
  right: {
    flex: 1,
  },
  dataWithBadge: {
    marginTop: 6,
  },
});

type Props = {
  label: string;
  data: React.ReactNode;
  iconLeft: React.ReactElement;
  labelBadge?: React.ReactNode;
};

const SummaryRowCustom = ({ label, data, iconLeft, labelBadge }: Props) => {
  return (
    <View style={styles.root}>
      <View style={styles.iconLeft}>{iconLeft}</View>
      <View style={styles.right}>
        <View style={styles.labelRow}>
          <LText style={styles.labelStyle} color="grey">
            {label}
          </LText>
          {labelBadge}
        </View>
        <View style={labelBadge ? styles.dataWithBadge : undefined}>{data}</View>
      </View>
    </View>
  );
};

export default SummaryRowCustom;
