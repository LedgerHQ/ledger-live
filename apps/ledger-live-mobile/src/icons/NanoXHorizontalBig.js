// @flow
import { useTheme } from "@react-navigation/native";
import React from "react";
import Svg, { Path, G, Circle, Rect } from "react-native-svg";

export default function NanoXHorizontalBig() {
  const { colors } = useTheme();
  return (
    <Svg viewBox="0 0 274 42" width="274" height="42">
      <G fill="none" fillRule="evenodd">
        <Rect
          width="271.606"
          height="39.606"
          x="1.197"
          y="1.197"
          fill={colors.live}
          fillOpacity=".12"
          stroke={colors.darkBlue}
          strokeWidth="2.394"
          rx="6.227"
        />
        <Path
          fill={"colors.white"}
          stroke={colors.darkBlue}
          stroke-width="2.394"
          d="M135 1.197c-10.937 0-19.803 8.866-19.803 19.803 0 10.937 8.866 19.803 19.803 19.803h135A2.803 2.803 0 0 0 272.803 38V4A2.803 2.803 0 0 0 270 1.197H135z"
        />
        <Circle
          cx="135"
          cy="21"
          r="10.5"
          stroke={colors.darkBlue}
          strokeLinejoin="square"
        />
        <Circle cx="135" cy="21" r="11.5" stroke={colors.fog} />
        <G>
          <Circle
            cx="25"
            cy="21"
            r="10.5"
            stroke={colors.darkBlue}
            strokeLinejoin="square"
          />
          <Circle
            cx="25"
            cy="21"
            r="11.5"
            stroke={colors.live}
            strokeOpacity=".2"
          />
        </G>
      </G>
    </Svg>
  );
}
