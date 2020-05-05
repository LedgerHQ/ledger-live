/* @flow */
import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import ArrowLeft from "../icons/ArrowLeft";
import colors from "../colors";

export default function HeaderBackImage() {
  return (
    <View style={styles.root}>
      <ArrowLeft size={16} color={colors.grey} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginLeft: Platform.OS === "ios" ? 0 : -13,
    padding: 16,
  },
});
