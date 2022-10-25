import React from "react";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import CurrencyGradient from "./CurrencyGradient";

function BackgroundGradient({
  currentPositionY,
  graphCardEndPosition,
  gradientColor,
}: {
  currentPositionY: Animated.SharedValue<number>;
  graphCardEndPosition: number;
  gradientColor: string;
}) {
  const BackgroundOverlayOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition - 40, graphCardEndPosition + 40],
      [1, 0],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  }, [graphCardEndPosition]);

  const { colors } = useTheme();

  return (
    <Animated.View
      justifyContent={"center"}
      style={[
        BackgroundOverlayOpacity,
        {
          background: colors.background.main,
          position: "absolute",
          width: 541,
          height: 450,
          top: 0,
        },
      ]}
    >
      <CurrencyGradient gradientColor={gradientColor} />
    </Animated.View>
  );
}

export default BackgroundGradient;
