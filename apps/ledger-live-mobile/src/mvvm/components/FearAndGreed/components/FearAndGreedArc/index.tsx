import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import Svg, { Path, Defs, LinearGradient, Stop, Text as SvgText, Circle } from "react-native-svg";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

const STROKE_WIDTH = 4;
const CX = 21.5814;
const CY = 21.5814;
const R = 19.5814 - 0.5;
const CURSOR_RADIUS = 3.5;
const CURSOR_STROKE_WIDTH = 1;
const WIDTH = 44;
const HEIGHT = 32;
const ANIMATION_DURATION = 1200;

interface FearAndGreedArcProps {
  readonly value: number;
}

export default function FearAndGreedArc({ value }: FearAndGreedArcProps) {
  const { theme } = useTheme();
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, animatedValue]);

  const startX = 3.37572;
  const startY = 28.8056;
  const endX = 39.7877;
  const endY = 28.8041;

  const startAngle = Math.atan2(startY - CY, startX - CX);
  const endAngle = Math.atan2(endY - CY, endX - CX);

  let angleRange = endAngle - startAngle;
  if (angleRange < 0) {
    angleRange += 2 * Math.PI;
  }

  const cursorPosition = useDerivedValue(() => {
    "worklet";
    const currentAngle = startAngle + (animatedValue.value / 100) * angleRange;
    return {
      x: CX + R * Math.cos(currentAngle),
      y: CY + R * Math.sin(currentAngle),
    };
  }, [animatedValue, startAngle, angleRange]);

  useDerivedValue(() => {
    "worklet";
    const rounded = Math.round(animatedValue.value);
    runOnJS(setDisplayValue)(rounded);
  }, [animatedValue]);

  const cursorStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      position: "absolute" as const,
      left: cursorPosition.value.x - CURSOR_RADIUS - CURSOR_STROKE_WIDTH,
      top: cursorPosition.value.y - CURSOR_RADIUS - CURSOR_STROKE_WIDTH,
    };
  }, [cursorPosition]);

  const cursorSize = (CURSOR_RADIUS + CURSOR_STROKE_WIDTH) * 2;

  return (
    <View style={{ width: WIDTH, height: HEIGHT, position: "relative" }}>
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Defs>
          <LinearGradient
            id="fearAndGreedGradient"
            x1="2"
            y1="15.4"
            x2="41.16"
            y2="15.4"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#F87274" />
            <Stop offset="1" stopColor="#6EC85C" />
          </LinearGradient>
        </Defs>
        <Path
          d="M3.37572 28.8056C2.48799 26.5704 2 24.1329 2 21.5814C2 10.7669 10.7669 2 21.5814 2C32.396 2 41.1629 10.7669 41.1629 21.5814C41.1629 24.1323 40.6751 26.5693 39.7877 28.8041"
          stroke="url(#fearAndGreedGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
        />
        <SvgText
          transform={[{ translateX: CX }, { translateY: CY }]}
          fill={theme.colors.text.base}
          fontSize={14}
          fontWeight="600"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontFamily="Inter"
        >
          {displayValue}
        </SvgText>
      </Svg>
      <Animated.View style={cursorStyle}>
        <Svg width={cursorSize} height={cursorSize} viewBox={`0 0 ${cursorSize} ${cursorSize}`}>
          <Circle
            cx={CURSOR_RADIUS + CURSOR_STROKE_WIDTH}
            cy={CURSOR_RADIUS + CURSOR_STROKE_WIDTH}
            r={CURSOR_RADIUS}
            fill="#FFF"
            stroke="#000"
            strokeWidth={CURSOR_STROKE_WIDTH}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
