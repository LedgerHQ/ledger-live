/* @flow */
import React, { Component } from "react";
import { Image, TouchableOpacity } from "react-native";

export default class Close extends Component<*> {
  onPress = () => {
    this.props.navigation.goBack();
  };
  render() {
    return (
      <TouchableOpacity onPress={this.onPress}>
        <Image
          source={require("../images/close.png")}
          style={{
            marginHorizontal: 10,
            width: 20,
            height: 20,
            tintColor: "white"
          }}
        />
      </TouchableOpacity>
    );
  }
}
