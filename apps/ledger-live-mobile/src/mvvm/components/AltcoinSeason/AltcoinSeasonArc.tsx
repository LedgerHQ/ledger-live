import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from "react-native-svg";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

const WIDTH = 68;
const HEIGHT = 44;
const STROKE_WIDTH = 6;
const CX = 34;
const CY = 34;
const R = 28;
const CURSOR_RADIUS = 5;
const CURSOR_STROKE_WIDTH = 1.5;
const ANIMATION_DURATION = 1200;

type Props = Readonly<{
  value: number;
}>;

export function AltcoinSeasonArc({ value }: Props) {
  const { theme } = useTheme();
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  const lastDisplayValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, animatedValue]);

  const startX = 6;
  const startY = 40;
  const endX = 62;
  const endY = 40;

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
    if (rounded !== lastDisplayValue.value) {
      lastDisplayValue.value = rounded;
      scheduleOnRN(setDisplayValue, rounded);
    }
  }, [animatedValue, lastDisplayValue]);

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
            id="altcoinSeasonGradient"
            x1="4"
            y1="22"
            x2="64"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#FF9416" />
            <Stop offset="1" stopColor="#3F51B5" />
          </LinearGradient>
        </Defs>
        <Path
          d="M6 40C4.7 36.7 4 33.1 4 29.3C4 12.7 17.4 4 34 4C50.6 4 64 12.7 64 29.3C64 33.1 63.3 36.7 62 40"
          stroke="url(#altcoinSeasonGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
        />
        <SvgText
          transform={[{ translateX: CX }, { translateY: CY - 1 }]}
          fill={theme.colors.text.base}
          fontSize={20}
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
