import React, { memo, useContext, useMemo, useState } from "react";
import { Animated, ImageBackground } from "react-native";
import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTheme } from "styled-components/native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import LinearGradient from "react-native-linear-gradient";

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

type Props = {
  scrollX: MaterialTopTabBarProps["position"];
  color?: string;
};

function WalletTabBackgroundGradient({ color, scrollX }: Props) {
  const { theme, colors } = useTheme();
  const { scrollY, headerHeight } = useContext(WalletTabNavigatorScrollContext);
  const [imageLoaded, setImageLoaded] = useState(false);

  const opacity = useMemo(
    () =>
      Animated.multiply(
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

  const gradientOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, headerHeight * 0.5],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [scrollY, headerHeight],
  );

  const containerStyle = [
    {
      position: "absolute" as const,
      width: 750,
      height: 880,
      top: -450,
      opacity,
    },
  ];

  const chosenSource = useMemo(() => {
    return theme === "dark"
      ? require("~/images/portfolio/dark.webp")
      : require("~/images/portfolio/light.webp");
  }, [theme]);

  if (color) {
    return (
      <Animated.View style={containerStyle}>
        <LinearGradient
          colors={[color, colors.background.main]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={containerStyle}>
      <AnimatedImageBackground
        source={chosenSource}
        style={{ width: "100%", height: "100%" }}
        onLoad={() => setImageLoaded(true)}
        onLoadStart={() => setImageLoaded(false)}
        fadeDuration={imageLoaded ? 0 : 300}
      />
      <Animated.View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          opacity: gradientOpacity,
        }}
      >
        <LinearGradient
          colors={["transparent", colors.background.main]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export default memo(WalletTabBackgroundGradient);
