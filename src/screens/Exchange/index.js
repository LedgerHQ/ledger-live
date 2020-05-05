// @flow

import React from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import colors from "../../colors";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";
import ComingSoon from "../../icons/ComingSoon";

const forceInset = { bottom: "always" };

export default function ExchangeScreen() {
  return (
    <SafeAreaView
      style={[styles.root, { paddingTop: extraStatusBarPadding }]}
      forceInset={forceInset}
    >
      <TrackScreen category="Exchange" />
      <View style={styles.body}>
        <ComingSoon />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 64,
  },
});
