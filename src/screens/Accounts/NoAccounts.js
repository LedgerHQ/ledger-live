// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

class NoAccounts extends PureComponent<{}> {
  render() {
    return <View style={styles.root}>{/* TODO */}</View>;
  }
}

export default NoAccounts;

const styles = StyleSheet.create({
  root: {
    padding: 40,
  },
  split: {
    height: 10,
  },
});
