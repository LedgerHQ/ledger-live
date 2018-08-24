/* @flow */
import React, { Component } from "react";
import Touchable from "./Touchable";
import CloseIcon from "../images/icons/Close";
import colors from "../colors";

export default class Close extends Component<*> {
  onPress = () => {
    this.props.navigation.goBack();
  };
  render() {
    return (
      <Touchable onPress={this.onPress} style={{ marginHorizontal: 16 }}>
        <CloseIcon size={18} color={colors.grey} />
      </Touchable>
    );
  }
}
