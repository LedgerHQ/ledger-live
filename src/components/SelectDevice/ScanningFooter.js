// @flow

import React, { PureComponent } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import LText from "../LText";

class ScanningFooter extends PureComponent<{}> {
  render() {
    return (
      <View style={styles.root}>
        <ActivityIndicator />
        <LText style={styles.text} numberOfLines={1}>
          Searching devices...
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
  },
  text: {},
});

export default ScanningFooter;
