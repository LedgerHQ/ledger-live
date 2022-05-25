import React from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

type Props = {
  color?: string;
  containerStyle?: any;
  children: React.ReactNode;
};

export default function GradientContainer({
  color,
  containerStyle,
  children,
}: Props) {
  const { colors } = useTheme();

  return (
    <Flex flex={1} borderRadius={8} overflow="hidden" style={containerStyle}>
      <Svg
        style={{ position: "absolute" }}
        preserveAspectRatio="xMinYMin slice"
      >
        <Defs>
          <LinearGradient
            id="myGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop
              offset="0%"
              stopOpacity={1}
              stopColor={color || colors.neutral.c30}
            />
            <Stop
              offset="100%"
              stopOpacity={0}
              stopColor={color || colors.neutral.c30}
            />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
      {children}
    </Flex>
  );
}
