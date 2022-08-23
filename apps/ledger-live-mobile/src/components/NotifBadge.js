import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 15,
    height: 15,
    borderRadius: 15,
    borderWidth: 3,
  },
});

export default () => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.live, borderColor: colors.white },
      ]}
    />
  );
};
