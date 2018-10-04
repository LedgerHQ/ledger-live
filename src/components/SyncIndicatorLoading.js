// @flow

import React, { Component } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../types/common";
import LText from "./LText";

type Props = {
  t: T,
};

class SyncIndicatorLoading extends Component<Props> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <ActivityIndicator />
        <LText style={styles.text}>{t("common.sync.loading")}</LText>
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

export default translate()(SyncIndicatorLoading);
