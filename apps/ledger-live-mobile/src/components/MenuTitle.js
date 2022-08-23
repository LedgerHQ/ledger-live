/* @flow */
import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import LText from "./LText";

export default class MenuTitle extends PureComponent<{ children: any }> {
  render() {
    const { children } = this.props;
    return (
      <View style={styles.root}>
        <LText semiBold style={styles.text}>
          {children}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    height: 60,
  },
  text: {
    fontSize: 16,
  },
});
