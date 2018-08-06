/* @flow */

import React, { Component } from "react";
import { Text, StyleSheet } from "react-native";

export default class HeaderRightText extends Component<{ children: * }> {
  render() {
    const { children } = this.props;
    return <Text style={styles.text}>{children}</Text>;
  }
}

const styles = StyleSheet.create({
  text: {
    color: "white",
    paddingHorizontal: 10,
  },
});
