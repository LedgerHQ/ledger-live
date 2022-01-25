// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Alert from "../icons/Alert";

type Props = {
  style?: *,
};

function ErrorBadge({ style }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.outer, { backgroundColor: colors.card }, style]}>
      <View style={[styles.inner, { backgroundColor: colors.alert }]}>
        <Alert size={16} color={"white"} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    padding: 0,
    borderRadius: 16,
    top: -12,
    right: -12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 24,
    height: 24,
    borderRadius: 12,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo<Props>(ErrorBadge);
