// @flow
import React from "react";
import Svg, { Path, Polyline } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

const Redelegate = ({
  size = 24,
  color,
}: {
  size?: number,
  color?: string,
}) => {
  const { colors } = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || colors.darkBlue}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="15 14 20 9 15 4" />
      <Path d="M4 20v-7a4 4 0 0 1 4-4h12" />
    </Svg>
  );
};

export default Redelegate;
