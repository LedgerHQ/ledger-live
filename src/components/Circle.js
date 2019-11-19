/* @flow */
import React, { Component } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  bg: string,
  size: number,
  children: *,
  crop?: boolean,
};
class Circle extends Component<Props> {
  render() {
    const { bg, size, children, crop } = this.props;

    return (
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: bg,
            height: size,
            width: size,
            overflow: !crop ? "visible" : "hidden",
          },
        ]}
      >
        {children}
      </View>
    );
  }
}

export default Circle;

const styles = StyleSheet.create({
  iconContainer: {
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});
