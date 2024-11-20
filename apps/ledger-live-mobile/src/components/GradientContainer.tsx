import React from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { StyleProp, ViewStyle } from "react-native";

type Direction = "top-to-bottom" | "left-to-right" | "bottom-to-top" | "right-to-left";
type Props = {
  color?: string;
  containerStyle?: StyleProp<ViewStyle>;
  gradientStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  startOpacity?: number;
  endOpacity?: number;
  direction?: Direction;
  borderRadius?: number;
};

function getPositions(direction: Direction) {
  let x1 = "0%";
  let y1 = "0%";
  let x2 = "0%";
  let y2 = "100%";

  switch (direction) {
    case "left-to-right":
      x2 = "100%";
      y2 = "0%";
      break;
    case "bottom-to-top":
      y1 = "100%";
      y2 = "0%";
      break;
    case "right-to-left":
      x1 = "100%";
      x2 = "0%";
      break;
  }

  return {
    x1,
    x2,
    y1,
    y2,
  };
}

export default function GradientContainer({
  color,
  containerStyle,
  gradientStyle,
  children,
  startOpacity = 1,
  endOpacity = 0,
  direction = "top-to-bottom",
  borderRadius,
}: Props) {
  const { colors } = useTheme();

  const gradientPositions = getPositions(direction);

  return (
    <Flex borderRadius={8} overflow="hidden" style={containerStyle}>
      <Svg
        style={[{ position: "absolute", width: "100%", height: "100%" }, gradientStyle]}
        preserveAspectRatio="xMinYMin slice"
      >
        <Defs>
          <LinearGradient {...gradientPositions} id="myGradient" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopOpacity={startOpacity} stopColor={color || colors.neutral.c30} />
            <Stop offset="100%" stopOpacity={endOpacity} stopColor={color || colors.neutral.c30} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" rx={borderRadius} width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
      {children}
    </Flex>
  );
}
