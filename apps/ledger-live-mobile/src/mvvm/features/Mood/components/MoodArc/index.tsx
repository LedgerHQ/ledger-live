import React from "react";
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Text as SvgText } from "react-native-svg";
import { useTheme } from "styled-components/native";

const STROKE_WIDTH = 4;
const CX = 21.5814;
const CY = 21.5814;
const R = 19.5814 - 0.5;
const CURSOR_RADIUS = 3.5;
const PADDING = CURSOR_RADIUS + 2;
const WIDTH = 44 + PADDING * 2;
const HEIGHT = 31 + PADDING * 2;

interface MoodArcProps {
  readonly value: number;
}

export default function MoodArc({ value }: MoodArcProps) {
  const { colors } = useTheme();
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

  const currentAngle = startAngle + (value / 100) * angleRange;
  const cursorX = CX + R * Math.cos(currentAngle);
  const cursorY = CY + R * Math.sin(currentAngle);

  return (
    <Svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`${-PADDING} ${-PADDING} ${44 + PADDING * 2} ${31 + PADDING * 2}`}
    >
      <Defs>
        <LinearGradient
          id="moodGradient"
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
        stroke="url(#moodGradient)"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        fill="none"
      />
      <Circle
        cx={cursorX}
        cy={cursorY}
        r={CURSOR_RADIUS}
        fill={colors.neutral.c00}
        stroke={colors.neutral.c100}
        strokeWidth={1}
      />
      <SvgText
        transform={[{ translateX: CX }, { translateY: CY }]}
        fill={colors.neutral.c100}
        fontSize={14}
        fontWeight="600"
        textAnchor="middle"
        alignmentBaseline="middle"
        fontFamily="Inter"
      >
        {Math.round(value)}
      </SvgText>
    </Svg>
  );
}
