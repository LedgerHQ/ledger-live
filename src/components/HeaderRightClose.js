/* @flow */
import React, { Component } from "react";
import { Image } from "react-native";
import Touchable from "./Touchable";

export default class Close extends Component<*> {
  onPress = () => {
    this.props.navigation.goBack();
  };
  render() {
    return (
      <Touchable onPress={this.onPress}>
        <Image
          source={require("../images/close.png")}
          style={{
            marginHorizontal: 10,
            width: 20,
            height: 20,
            tintColor: "white",
          }}
        />
      </Touchable>
    );
  }
}
