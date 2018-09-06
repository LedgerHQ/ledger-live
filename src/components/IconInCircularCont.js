/* @flow */
import React, { Component } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  icon: any,
  bgIconContainer: string,
  size: number,
};
class IconInCircularCont extends Component<Props> {
  render() {
    const { icon, bgIconContainer, size } = this.props;

    return (
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: bgIconContainer, height: size, width: size },
        ]}
      >
        {icon}
      </View>
    );
  }
}

export default IconInCircularCont;

const styles = StyleSheet.create({
  iconContainer: {
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
