/* @flow */

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";

export default class HeaderRightText extends Component<{ children: * }> {
  render() {
    const { children } = this.props;
    return (
      <LText style={styles.text} color="white">
        {children}
      </LText>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    paddingHorizontal: 10,
  },
});
