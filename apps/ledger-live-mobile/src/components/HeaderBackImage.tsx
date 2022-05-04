import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";

export default function HeaderBackImage() {
  return (
    <View style={styles.root}>
      <ArrowLeftMedium size={24} color={"neutral.c100"} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginLeft: Platform.OS === "ios" ? 0 : -13,
    padding: 16,
  },
});
