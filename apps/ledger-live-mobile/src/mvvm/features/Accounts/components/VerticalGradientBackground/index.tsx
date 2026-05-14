import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";

type Props = {
  stopColor: string;
  stopOpacity?: number;
  topOffset?: number;
};

export default function VerticalGradientBackground({
  stopColor,
  stopOpacity = 0.3,
  topOffset = 0,
}: Props) {
  return (
    <Svg
      style={{
        ...StyleSheet.absoluteFillObject,
        top: topOffset,
        flexShrink: 0,
      }}
      width="100%"
      height="395px"
    >
      <Defs>
        <LinearGradient id="verticalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopOpacity={stopOpacity} stopColor={stopColor} />
          <Stop offset="100%" stopOpacity={0} stopColor={stopColor} />
        </LinearGradient>
      </Defs>
      <Rect
        transform={[{ translateX: 0 }, { translateY: 0 }]}
        width="100%"
        height="100%"
        fill="url(#verticalGradient)"
      />
    </Svg>
  );
}
