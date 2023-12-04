import React from "react";
import { ActivityIndicator } from "react-native";
import { useTheme } from "styled-components/native";
import Config from "react-native-config";

export default () => {
  const { colors } = useTheme();
  return (
    <ActivityIndicator
      style={{
        margin: 40,
      }}
      color={colors.primary.c80}
      animating={!Config.MOCK}
    />
  );
};
