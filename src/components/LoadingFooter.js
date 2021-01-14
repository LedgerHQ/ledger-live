/* @flow */
import React from "react";
import { ActivityIndicator } from "react-native";
import { useTheme } from "@react-navigation/native";

export default () => {
  const { colors } = useTheme();
  return <ActivityIndicator style={{ margin: 40 }} color={colors.live} />;
};
