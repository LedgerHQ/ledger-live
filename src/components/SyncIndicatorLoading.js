// @flow

import React, { Component } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import LText from "./LText";

export default class SyncIndicatorLoading extends Component<*> {
  render() {
    return (
      <View style={styles.root}>
        <ActivityIndicator />
        <LText style={styles.text}>Sync</LText>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
  },
  text: {
    color: "#000",
  },
});
