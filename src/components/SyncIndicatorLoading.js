// @flow

import React, { Component } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Trans } from "react-i18next";

import LText from "./LText";

type Props = {};

class SyncIndicatorLoading extends Component<Props> {
  render() {
    return (
      <View style={styles.root}>
        <ActivityIndicator />
        <LText style={styles.text}>
          <Trans i18nKey="sync.loading" />
        </LText>
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

export default SyncIndicatorLoading;
