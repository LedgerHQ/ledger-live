/* @flow */

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import colors from "../../colors";

export default class SectionSeparator extends Component<*> {
  render() {
    return <View style={styles.separator} />;
  }
}

const styles = StyleSheet.create({
  separator: {
    marginHorizontal: 16,
    paddingVertical: 16,
    borderBottomColor: colors.lightFog,
    borderBottomWidth: 2,
  },
});
