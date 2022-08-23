// @flow
import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

type Props = {
  size?: number,
  color?: string,
  strokeColor?: string,
  style?: any,
};

export default function ExclamationCircle({
  size = 16,
  color,
  strokeColor,
  style,
}: Props) {
  const { colors } = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <Circle
        cx="18"
        cy="18"
        r="16"
        fill={color || colors.warning}
        stroke={strokeColor || colors.white}
        strokeWidth="4"
      />
      <Circle cx={18} cy={24.5} r={1.5} fill={strokeColor || colors.white} />
      <Path
        d="M18 11v8"
        stroke={strokeColor || colors.white}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
