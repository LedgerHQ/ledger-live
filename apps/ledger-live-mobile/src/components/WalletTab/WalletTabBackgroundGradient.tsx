import React, { memo, useContext, useMemo, useState } from "react";
import { Animated, ImageBackground } from "react-native";
import { useTheme } from "styled-components/native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import LinearGradient from "react-native-linear-gradient";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

type Props = {
  visible?: boolean;
  color?: string;
};

function WalletTabBackgroundGradient({ color, visible = true }: Readonly<Props>) {
  const { theme, colors } = useTheme();
  const { scrollY, headerHeight } = useContext(WalletTabNavigatorScrollContext);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isWallet40Enabled, isWallet40DarkMode } = useWallet40Theme("mobile");

  const opacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [scrollY, headerHeight],
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

  const containerStyle = useMemo(
    () => ({
      position: "absolute" as const,
      opacity,
      ...(isWallet40Enabled
        ? {
            width: "100%" as const,
            height: 500,
            top: 0,
            left: 0,
          }
        : {
            width: 750,
            height: 880,
            top: -450,
          }),
    }),
    [isWallet40Enabled, opacity],
  );

  const chosenSource = useMemo(() => {
    if (isWallet40Enabled && theme === "dark") {
      return require("~/images/portfolio/v4-dark.webp");
    }
    return theme === "dark"
      ? require("~/images/portfolio/dark.webp")
      : require("~/images/portfolio/light.webp");
  }, [theme, isWallet40Enabled]);

  // Wallet 4.0 light mode uses a solid background color
  const isWallet40LightMode = isWallet40Enabled && !isWallet40DarkMode;

  if (color || isWallet40LightMode) {
    const backgroundColor = color ?? colors.background.main;
    return (
      <Animated.View style={[containerStyle, { opacity: visible ? opacity : 0 }]}>
        <LinearGradient
          colors={[backgroundColor, colors.background.main]}
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
      {isWallet40DarkMode ? (
        // Wallet 4.0: permanent gradient from transparent to black (faster fade)
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)", "#000000"]}
          locations={[0, 0.5, 0.85]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
          }}
        />
      ) : (
        // Legacy: animated gradient on scroll
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
      )}
    </Animated.View>
  );
}

export default memo(WalletTabBackgroundGradient);
