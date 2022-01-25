// @flow
import { useTheme } from "@react-navigation/native";
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

function CounterValuesSeparator() {
  const { colors } = useTheme();
  return (
    <View style={styles.separator}>
      <View style={[styles.line, { backgroundColor: colors.fog }]} />
      {/* TODO: "Use Max" Button when feature is ready */}
      <View style={[styles.line, { backgroundColor: colors.fog }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  separator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
  },
  line: {
    width: "100%",
    flex: 1,
    height: 1,
  },
});

export default memo<*>(CounterValuesSeparator);
