// @flow

import { useTheme } from "@react-navigation/native";
import React from "react";
import Svg, { Path, G } from "react-native-svg";

export default function Blue() {
  const { colors } = useTheme();
  return (
    <Svg width="52" height="72" viewBox="0 0 52 72">
      <G fill="none" fillRule="evenodd">
        <Path
          fill={colors.darkBlue}
          d="M50.98 9.257c.564 0 1.02.457 1.02 1.02v4.132a1.02 1.02 0 0 1-2.04 0v-4.132c0-.563.457-1.02 1.02-1.02z"
        />
        <Path
          fill={colors.live}
          fillOpacity=".1"
          stroke={colors.darkBlue}
          strokeWidth="1.5"
          d="M3.2.75A2.45 2.45 0 0 0 .75 3.2v65.6a2.45 2.45 0 0 0 2.45 2.45h44.58a2.45 2.45 0 0 0 2.45-2.45V3.2A2.45 2.45 0 0 0 47.78.75H3.2z"
        />
        <Path
          fill={colors.white}
          stroke={colors.live}
          strokeWidth=".5"
          d="M10.553 10.021a2.15 2.15 0 0 0-2.15 2.15v48.686a2.15 2.15 0 0 0 2.15 2.15h29.866a2.15 2.15 0 0 0 2.15-2.15V12.171a2.15 2.15 0 0 0-2.15-2.15H10.553z"
        />
      </G>
    </Svg>
  );
}
