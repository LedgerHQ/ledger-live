import React, { memo, useContext, useMemo, useState } from "react";
import { Animated, ImageBackground } from "react-native";
import { useTheme } from "styled-components/native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import LinearGradient from "react-native-linear-gradient";

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

type Props = {
  visible?: boolean;
  color?: string;
};

function WalletTabBackgroundGradient({ color, visible = true }: Readonly<Props>) {
  const { theme, colors } = useTheme();
  const { scrollY, headerHeight } = useContext(WalletTabNavigatorScrollContext);
  const [imageLoaded, setImageLoaded] = useState(false);

  const opacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [scrollY, headerHeight],
  );

  const containerStyle = useMemo(
    () => ({
      position: "absolute" as const,
      opacity,
      width: "100%" as const,
      aspectRatio: 1,
      top: 0,
      left: 0,
    }),
    [opacity],
  );

  const chosenSource = useMemo(
    () =>
      theme === "dark"
        ? require("~/images/portfolio/v4-dark.webp")
        : require("~/images/portfolio/v4-light.webp"),
    [theme],
  );

  if (color) {
    return (
      <Animated.View style={[containerStyle, { opacity: visible ? opacity : 0 }]}>
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
    </Animated.View>
  );
}

export default memo(WalletTabBackgroundGradient);
