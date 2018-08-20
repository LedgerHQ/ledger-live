/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";

import colors from "../colors";
import GenericButton from "./Touchable";

type Props = {
  children: React$Node,
  onPress: () => *,
  containerStyle?: *,
  outlineColor?: string,
};

export default class OutlineButton extends Component<Props> {
  render() {
    const { children, outlineColor } = this.props;
    const outline = outlineColor
      ? {
          borderColor: outlineColor,
        }
      : {};
    return (
      <GenericButton
        {...this.props}
        style={[styles.containerStyle, this.props.containerStyle, outline]}
      >
        {children}
      </GenericButton>
    );
  }
}

const styles = StyleSheet.create({
  containerStyle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.live,
    paddingVertical: 16,
  },
});
