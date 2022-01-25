// @flow
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Switch as RNSwitch, Platform } from "react-native";

export default function Switch(props: *) {
  const { colors } = useTheme();

  return (
    <RNSwitch
      {...props}
      {...(Platform.OS === "android"
        ? { trackColor: { true: colors.lightLive, false: colors.fog } }
        : {})}
    />
  );
}
