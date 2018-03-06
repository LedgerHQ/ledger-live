/* @flow */

import React, { Component } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import colors from "../colors";
import LText from "./LText";

export default class GenericButton extends Component<{
  onPress: () => void,
  title: string,
  color: string,
  backgroundColor: string,
  containerStyle: ?*,
  titleStyle: ?*,
  withShadow?: boolean
}> {
  render() {
    const {
      onPress,
      title,
      color,
      containerStyle,
      titleStyle,
      backgroundColor,
      withShadow
    } = this.props;
    return (
      <TouchableOpacity onPress={onPress}>
        <View
          style={[
            styles.container,
            containerStyle,
            withShadow && styles.shadow
          ]}
        >
          <LText style={[styles.title, titleStyle]}>{title}</LText>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {},
  shadow: {}
});
