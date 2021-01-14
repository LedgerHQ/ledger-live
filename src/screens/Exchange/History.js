// @flow
import React from "react";
import { StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import TrackScreen from "../../analytics/TrackScreen";
import CoinifyWidget from "./CoinifyWidget";

const forceInset = { bottom: "always" };

export default function History() {
  return (
    <SafeAreaView style={[styles.root]} forceInset={forceInset}>
      <TrackScreen category="ExchangeHistory" />
      <CoinifyWidget mode="trade-history" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});
