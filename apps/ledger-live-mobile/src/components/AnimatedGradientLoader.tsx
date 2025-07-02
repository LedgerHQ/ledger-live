import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Text, Flex } from "@ledgerhq/native-ui";
import Svg, { Defs, LinearGradient, Rect, Stop, Mask, RadialGradient } from "react-native-svg";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface AnimatedGradientLoaderProps {
  children: React.ReactNode;
}

export const AnimatedGradientLoader: React.FC<AnimatedGradientLoaderProps> = ({ children }) => {
  const { colors, dark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth, screenWidth],
  });

  // Using a purple gradient similar to the desktop version
  const gradientColor = dark ? "rgba(187, 176, 255, 0.3)" : "rgba(187, 176, 255, 0.4)";

  return (
    <View style={styles.container}>
      <View style={styles.loaderContainer}>
        <Svg
          width={screenWidth}
          height={200}
          style={StyleSheet.absoluteFillObject}
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            <RadialGradient id="maskGradient" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="white" stopOpacity="1" />
              <Stop offset="70%" stopColor="white" stopOpacity="0" />
            </RadialGradient>
            <Mask id="radialMask">
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#maskGradient)" />
            </Mask>
          </Defs>
        </Svg>
        <AnimatedSvg
          width={screenWidth * 2}
          height={200}
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateX }],
            },
          ]}
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={gradientColor} stopOpacity="0" />
              <Stop offset="20%" stopColor={gradientColor} stopOpacity="0.1" />
              <Stop offset="50%" stopColor={gradientColor} stopOpacity="0.3" />
              <Stop offset="80%" stopColor={gradientColor} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#waveGradient)"
            mask="url(#radialMask)"
          />
        </AnimatedSvg>
      </View>
      <Flex px={6} alignItems="center">
        <Text
          variant="large"
          fontWeight="medium"
          color={dark ? "neutral.c100" : "neutral.c00"}
          textAlign="center"
          style={styles.text}
        >
          {children}
        </Text>
      </Flex>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  loaderContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    letterSpacing: -0.44,
    maxWidth: "100%",
  },
});