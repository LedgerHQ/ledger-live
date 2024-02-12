import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const styles = StyleSheet.create({
  iconContainer: {
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});

type Props = {
  bg?: string;
  size: number;
  crop?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const Circle = ({ bg, size, crop, style, children }: Props) => {
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
};

export default Circle;
