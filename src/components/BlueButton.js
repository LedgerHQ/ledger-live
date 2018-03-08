/* @flow */
import React, { Component } from "react";
import colors from "../colors";
import GenericButton from "./GenericButton";

export default class BlueButton extends Component<*> {
  render() {
    return (
      <GenericButton
        {...this.props}
        titleStyle={{ color: "white" }}
        containerStyle={{ backgroundColor: colors.blue }}
      />
    );
  }
}
