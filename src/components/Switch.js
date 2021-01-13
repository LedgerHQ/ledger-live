// @flow
import { useTheme } from "@react-navigation/native";
import React from "react";
import { Switch as RNSwitch } from "react-native";

export default function Switch(props: *) {
  const { colors } = useTheme();

  return (
    <RNSwitch
      {...props}
      trackColor={{ true: colors.lightLive, false: colors.fog }}
    />
  );
}
