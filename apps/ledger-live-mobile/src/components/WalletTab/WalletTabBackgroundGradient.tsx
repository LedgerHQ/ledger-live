import React, { memo, useContext, useMemo } from "react";
import { Animated } from "react-native";
import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTheme } from "styled-components/native";
import { LinearGradient } from "expo-linear-gradient";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

import multiply = Animated.multiply;

type Props = {
  scrollX: MaterialTopTabBarProps["position"];
  color?: string;
};

function WalletTabBackgroundGradient({ color, scrollX }: Props) {
  const { colors } = useTheme();
  const { scrollY, headerHeight } = useContext(WalletTabNavigatorScrollContext);

  const opacity = useMemo(
    () =>
      multiply(
        scrollY.interpolate({
          inputRange: [0, headerHeight],
          outputRange: [1, 0],
          extrapolate: "clamp",
        }),
        scrollX.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0],
          extrapolate: "clamp",
        }),
      ),
    [scrollY, headerHeight, scrollX],
  );

  const containerStyle = [
    {
      position: "absolute" as const,
      width: 850,
      height: 480,
      top: -130,
    },
    { opacity },
  ];

  return (
    <Animated.View style={containerStyle}>
      <LinearGradient
        colors={[color || "#9475c3", color || "#70599f", colors.background.main]}
        locations={[0.3, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ width: "100%", height: "100%" }}
      />
    </Animated.View>
  );
}

export default memo(WalletTabBackgroundGradient);
