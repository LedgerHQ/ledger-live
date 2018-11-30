// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";
import Touchable from "./Touchable";

export default class SyncIndicatorStatus extends Component<*> {
  render() {
    const { isUpToDate, onPress } = this.props;
    return (
      <Touchable event="SyncIndicatorStatus" onPress={onPress}>
        <LText style={styles.text}>
          {isUpToDate ? "Up to date" : "Outdated"}
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
