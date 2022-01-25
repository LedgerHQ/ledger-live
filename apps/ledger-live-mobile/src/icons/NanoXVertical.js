// @flow

import { useTheme } from "@react-navigation/native";
import React from "react";
import Svg, { Path, G, Ellipse } from "react-native-svg";

type Props = {
  size?: number,
  style?: *,
};

export default function NanoXVertical({ size, style }: Props) {
  const { colors } = useTheme();
  return (
    <Svg
      width={(size && (size / 72) * 13) || 13}
      height={size || 72}
      viewBox="0 0 13 72"
      style={style}
    >
      <G fill="none" fillRule="evenodd">
        <Path
          fill={colors.live}
          fillOpacity=".1"
          stroke={colors.darkBlue}
          strokeWidth="1.5"
          d="M1.6.75a.85.85 0 0 0-.85.85v68.8c0 .47.38.85.85.85h9.28c.47 0 .85-.38.85-.85V1.6a.85.85 0 0 0-.85-.85H1.6z"
        />
        <Path
          fill={colors.white}
          stroke={colors.live}
          strokeWidth=".5"
          d="M3.92 12.25a.55.55 0 0 0-.55.55v13.13c0 .304.246.55.55.55h4.64a.55.55 0 0 0 .55-.55V12.8a.55.55 0 0 0-.55-.55H3.92z"
        />
        <Path
          fill={colors.white}
          stroke={colors.darkBlue}
          strokeWidth="1.5"
          d="M6.24 31.607a5.49 5.49 0 0 0-5.49 5.49V70.4c0 .47.38.85.85.85h9.28c.47 0 .85-.38.85-.85V37.097a5.49 5.49 0 0 0-5.49-5.49z"
        />
        <Ellipse
          cx="6.24"
          cy="37.029"
          fill={colors.white}
          stroke={colors.live}
          strokeWidth=".5"
          rx="2.87"
          ry="2.836"
        />
        <Ellipse
          cx="6.24"
          cy="6.029"
          fill={colors.white}
          stroke={colors.live}
          strokeWidth=".5"
          rx="2.87"
          ry="2.836"
        />
      </G>
    </Svg>
  );
}
