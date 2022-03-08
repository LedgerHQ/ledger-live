import React, { useEffect } from "react";
import { Svg, Circle, G } from "react-native-svg";
import { useTheme } from "styled-components/native";
import { TouchableOpacity } from "react-native";
import { Flex } from "../../Layout";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";

type Props = {
  /**
   * float number between 0 and 1
   */
  progress?: number;
  infinite?: boolean;

  onPress?: () => void;

  mainColor?: string;
  secondaryColor?: string;

  radius?: number;
  strokeWidth?: number;

  children?: React.ReactNode;

  frontStrokeLinecap?: "butt" | "round";
};

const ProgressLoader = ({
  progress = 0,
  infinite,
  mainColor,
  secondaryColor,
  onPress,
  radius = 48,
  strokeWidth = 4,
  frontStrokeLinecap = "butt",
  children,
}: Props): React.ReactElement => {
  const { colors } = useTheme();
  const backgroundColor = secondaryColor || colors.primary.c30;
  const progressColor = mainColor || colors.primary.c80;

  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset = circumference * (1 - progress);

  const rotation = useSharedValue(0);
  const animatedStyles = useAnimatedStyle(
    () => ({
      transform: [
        {
          rotateZ: `${rotation.value}deg`,
        },
      ],
    }),
    [rotation.value],
  );

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1, // Infinite
    );
    return () => cancelAnimation(rotation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (infinite) {
    return (
      <TouchableOpacity disabled={!onPress} onPress={onPress} activeOpacity={1}>
        <Flex alignItems="center" justifyContent="center">
          <Animated.View style={animatedStyles}>
            <Svg width={radius * 2} height={radius * 2}>
              <Circle
                cx={radius}
                cy={radius}
                fill="transparent"
                r={normalizedRadius}
                stroke={backgroundColor}
                strokeWidth={strokeWidth}
              />
              <Circle
                cx={radius}
                cy={radius}
                fill="transparent"
                r={normalizedRadius}
                stroke={progressColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference / 4}, ${circumference}`}
                strokeDashoffset="500"
                strokeLinecap={frontStrokeLinecap}
              />
            </Svg>
          </Animated.View>
          <Flex position="absolute">{children}</Flex>
        </Flex>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} activeOpacity={1}>
      <Flex alignItems="center" justifyContent="center">
        <Svg width={radius * 2} height={radius * 2}>
          <Circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="transparent"
            stroke={backgroundColor}
            strokeDashoffset={0}
            strokeWidth={strokeWidth}
          />
          <G transform={`rotate(-90) translate(-${radius * 2}, 0)`}>
            <Circle
              cx={radius}
              cy={radius}
              r={normalizedRadius}
              fill="transparent"
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap={frontStrokeLinecap}
            />
          </G>
        </Svg>
        <Flex position="absolute">{children}</Flex>
      </Flex>
    </TouchableOpacity>
  );
};

export default ProgressLoader;
