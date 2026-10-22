import React from "react";
import { View } from "react-native";

const chainable: object = new Proxy({}, { get: () => () => chainable });

export const Gesture = new Proxy({}, { get: () => () => chainable });

export const GestureDetector = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export const GestureHandlerRootView = ({ children }: { children?: React.ReactNode }) => (
  <View>{children}</View>
);
