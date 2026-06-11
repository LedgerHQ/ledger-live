import React, { useEffect, useId, useState } from "react";
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

const VIEWBOX_WIDTH = 88;
const VIEWBOX_HEIGHT = 64;
const STROKE_WIDTH = 8;
const CX = 43.1628;
const CY = 43.1628;
const R = 38.1628;
const CURSOR_RADIUS = 7;
const CURSOR_STROKE_WIDTH = 2;
const FONT_SIZE = 28;
const ANIMATION_DURATION = 1200;

const ARC_PATH =
  "M6.75144 57.6112C4.97598 53.1408 4 48.2658 4 43.1628C4 21.5338 21.5338 4 43.1628 4C64.792 4 82.3258 21.5338 82.3258 43.1628C82.3258 48.2646 81.3502 53.1386 79.5754 57.6082";
const ARC_START = { x: 6.75144, y: 57.6112 };
const ARC_END = { x: 79.5754, y: 57.6082 };

export type ArcGaugeAppearance = "compact" | "expanded";

const SCALE_BY_APPEARANCE: Record<ArcGaugeAppearance, number> = {
  compact: 0.5,
  expanded: 0.65,
};

type Props = Readonly<{
  value: number;
  appearance?: ArcGaugeAppearance;
  startColor: string;
  endColor: string;
}>;

export default function ArcGaugeIndicator({
  value,
  appearance = "compact",
  startColor,
  endColor,
}: Props) {
  const { theme } = useTheme();
  // react-native-svg mis-resolves the ":" that useId emits inside url(#...) references.
  const gradientId = `arcGaugeGradient-${useId().replace(/:/g, "")}`;
  const scale = SCALE_BY_APPEARANCE[appearance];
  const width = VIEWBOX_WIDTH * scale;
  const height = VIEWBOX_HEIGHT * scale;
  const cursorRadius = CURSOR_RADIUS * scale;
  const cursorStrokeWidth = CURSOR_STROKE_WIDTH * scale;
  const cursorSize = (cursorRadius + cursorStrokeWidth) * 2;

  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  const lastDisplayValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, animatedValue]);

  const startAngle = Math.atan2(ARC_START.y - CY, ARC_START.x - CX);
  const endAngle = Math.atan2(ARC_END.y - CY, ARC_END.x - CX);

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
      left: cursorPosition.value.x * scale - cursorRadius - cursorStrokeWidth,
      top: cursorPosition.value.y * scale - cursorRadius - cursorStrokeWidth,
    };
  }, [cursorPosition, scale, cursorRadius, cursorStrokeWidth]);

  return (
    <View style={{ width, height, position: "relative" }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        <Defs>
          <LinearGradient
            id={gradientId}
            x1="4"
            y1="30.8"
            x2="82.32"
            y2="30.8"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={startColor} />
            <Stop offset="1" stopColor={endColor} />
          </LinearGradient>
        </Defs>
        <Path
          d={ARC_PATH}
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
        />
        <SvgText
          transform={[{ translateX: CX }, { translateY: CY }]}
          fill={theme.colors.text.base}
          fontSize={FONT_SIZE}
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
            cx={cursorRadius + cursorStrokeWidth}
            cy={cursorRadius + cursorStrokeWidth}
            r={cursorRadius}
            fill="#FFF"
            stroke="#000"
            strokeWidth={cursorStrokeWidth}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
