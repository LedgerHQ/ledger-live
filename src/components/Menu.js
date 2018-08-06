/* @flow */

import React, { Component } from "react";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";

/**
 * Menu takes the full space.
 * typically rendered inside a modal.
 */
export default class Menu extends Component<{
  header: *,
  children: *,
  onRequestClose: () => void,
}> {
  render() {
    const { header, children, onRequestClose } = this.props;
    return (
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.container}>
          <View style={styles.main}>
            <View style={styles.head}>{header}</View>
            <View style={styles.body}>{children}</View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  main: {},
  head: {
    backgroundColor: "white",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  body: {
    backgroundColor: "white",
  },
});
