import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

interface AnimatedGradientLoaderProps {
  children: React.ReactNode;
}

export const AnimatedGradientLoader: React.FC<AnimatedGradientLoaderProps> = ({ children }) => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.6,
          duration: 1250,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1250,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  return (
    <View style={styles.container}>
      <Text
        variant="large"
        fontWeight="medium"
        color="neutral.c100"
        textAlign="center"
        style={styles.text}
      >
        {children}
      </Text>
      <AnimatedSvg
        style={[
          styles.gradientBackground,
          {
            opacity: animatedValue,
          },
        ]}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="rgba(187, 176, 255, 0.5)" />
            <Stop offset="40%" stopColor="rgba(187, 176, 255, 0.3)" />
            <Stop offset="70%" stopColor="rgba(187, 176, 255, 0.08)" />
            <Stop offset="100%" stopColor="rgba(187, 176, 255, 0)" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradient)" />
      </AnimatedSvg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    height: "100%",
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientBackground: {
    position: "absolute",
    width: "100%",
    height: "50%",
    bottom: 0,
    left: 0,
  },
  text: {
    zIndex: 1,
    fontSize: 22,
    letterSpacing: -0.44,
    paddingHorizontal: 20,
    maxWidth: "100%",
  },
});
