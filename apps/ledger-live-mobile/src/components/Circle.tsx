import React, { Component } from "react";
import { StyleProp, ViewStyle, StyleSheet, View } from "react-native";

type Props = {
  bg?: string;
  size: number;
  children?: React.ReactNode;
  crop?: boolean;
  style?: StyleProp<ViewStyle>;
};

class Circle extends Component<Props> {
  render() {
    const { bg, size, children, crop, style } = this.props;
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
          style,
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
