/* @flow */

import React, { Component } from "react";
import { Text, StyleSheet } from "react-native";

export default class HeaderRightText extends Component<{ children: * }> {
  render() {
    const { children } = this.props;
    return (
      <Text style={styles.text} color="white">
        {children}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    paddingHorizontal: 10,
  },
});
