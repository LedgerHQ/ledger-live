// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import LText from "./LText";
import Touchable from "./Touchable";

export default class SyncIndicatorStatus extends Component<*> {
  render() {
    const { isUpToDate, onPress } = this.props;
    return (
      <Touchable event="SyncIndicatorStatus" onPress={onPress}>
        <LText style={styles.text}>
          <Trans i18nKey={`common.${isUpToDate ? "upToDate" : "outdated"}`} />
        </LText>
      </Touchable>
    );
  }
}
const styles = StyleSheet.create({
  text: {
    color: "#000",
  },
});
