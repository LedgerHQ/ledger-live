import React from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { StyleProp, ViewStyle } from "react-native";

type Props = {
  color?: string;
  containerStyle?: StyleProp<ViewStyle>;
  gradientStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  startOpacity?: number;
  endOpacity?: number;
};

export default function GradientContainer({
  color,
  containerStyle,
  gradientStyle,
  children,
  startOpacity = 1,
  endOpacity = 0,
}: Props) {
  const { colors } = useTheme();

  return (
    <Flex flex={1} borderRadius={8} overflow="hidden" style={containerStyle}>
      <Svg style={[{ position: "absolute" }, gradientStyle]} preserveAspectRatio="xMinYMin slice">
        <Defs>
          <LinearGradient
            id="myGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopOpacity={startOpacity} stopColor={color || colors.neutral.c30} />
            <Stop offset="100%" stopOpacity={endOpacity} stopColor={color || colors.neutral.c30} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
      {children}
    </Flex>
  );
}
