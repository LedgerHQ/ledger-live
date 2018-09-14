// @flow

import React, { Component } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onPress?: () => void,
  children: any,
  style?: any,
};

export default class Card extends Component<Props> {
  render() {
    const { onPress, style, children } = this.props;
    return onPress ? (
      <TouchableOpacity onPress={onPress} style={[styles.root, style]}>
        {children}
      </TouchableOpacity>
    ) : (
      <View style={[styles.root, style]}>{children}</View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "white",
    borderRadius: 4,
  },
});
