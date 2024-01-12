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
  iconLeft: {
    paddingRight: 16,
  },
  right: {
    flex: 1,
  },
});

type Props = {
  label: string;
  data: React.ReactNode;
  iconLeft: React.ReactElement;
};

const SummaryRowCustom = ({ label, data, iconLeft }: Props) => {
  return (
    <View style={styles.root}>
      <View style={styles.iconLeft}>{iconLeft}</View>
      <View style={styles.right}>
        <LText style={styles.labelStyle} color="grey">
          {label}
        </LText>
        {data}
      </View>
    </View>
  );
};

export default SummaryRowCustom;
