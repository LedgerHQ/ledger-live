/* @flow */
import React from "react";
import { ActivityIndicator } from "react-native";
import { useTheme } from "@react-navigation/native";
import Config from "react-native-config";

export default () => {
  const { colors } = useTheme();
  return (
    <ActivityIndicator
      style={{ margin: 40 }}
      color={colors.live}
      animating={!Config.MOCK}
    />
  );
};
