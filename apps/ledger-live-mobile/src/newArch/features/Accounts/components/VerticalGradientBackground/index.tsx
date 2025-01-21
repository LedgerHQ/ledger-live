import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";

export default function VerticalGradientBackground({ stopColor }: { stopColor: string }) {
  return (
    <Svg
      style={{
        ...StyleSheet.absoluteFillObject,
        top: 0,
        flexShrink: 0,
      }}
      width="100%"
      height="395px"
    >
      <Defs>
        <LinearGradient id="verticalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopOpacity={0.3} stopColor={stopColor} />
          <Stop offset="100%" stopOpacity={0} stopColor={stopColor} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#verticalGradient)" />
    </Svg>
  );
}
