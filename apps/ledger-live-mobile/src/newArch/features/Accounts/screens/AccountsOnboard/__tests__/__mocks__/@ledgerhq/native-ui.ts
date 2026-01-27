/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { View, TouchableOpacity } from "react-native";

const mockViewComponentFn = ({ children, testID, ...props }: any) =>
  React.createElement(View, { testID, ...props }, children);

export const Button = ({ children, onPress, testID, disabled, ...props }: any) => {
  const buttonProps: any = { testID, onPress: disabled ? undefined : onPress, ...props };
  if (disabled !== undefined) {
    buttonProps.disabled = disabled;
  }
  return React.createElement(TouchableOpacity, buttonProps, children);
};

export const Flex = mockViewComponentFn;
export const InfiniteLoader = () => React.createElement(View, { testID: "infinite-loader" });
