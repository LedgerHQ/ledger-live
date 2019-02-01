/* @flow */
import React, { Component } from "react";
import { TouchableWithoutFeedback, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import LText from "./LText";
import colors from "../colors";

class HeaderTitle extends Component<*> {
  onPress = () => {
    this.props.navigation.emit("refocus");
  };

  render() {
    const { style, ...newProps } = this.props;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <LText
          {...newProps}
          secondary
          semiBold
          style={[styleSheet.root, style]}
        />
      </TouchableWithoutFeedback>
    );
  }
}

export default withNavigation(HeaderTitle);

const styleSheet = StyleSheet.create({
  root: {
    color: colors.darkBlue,
    fontSize: 16,
    textAlign: "center",
    flexGrow: 1,
    paddingVertical: 5,
  },
});
