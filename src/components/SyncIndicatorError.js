// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";
import Touchable from "./Touchable";

export default class SyncIndicatorError extends Component<*> {
  render() {
    const { onPress } = this.props;
    return (
      <Touchable onPress={onPress}>
        <LText style={styles.text}>Sync Error</LText>
      </Touchable>
    );
  }
}
const styles = StyleSheet.create({
  text: {
    color: "#f00",
  },
});
