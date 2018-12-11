// @flow
import React from "react";
import Svg, { Path, G, Circle, Rect } from "react-native-svg";

export default function NanoXHorizontalBig() {
  return (
    <Svg viewBox="0 0 274 42" width="274" height="42">
      <G fill="none" fillRule="evenodd">
        <Rect
          width="271.606"
          height="39.606"
          x="1.197"
          y="1.197"
          fill="#6490F1"
          fillOpacity=".12"
          stroke="#142533"
          strokeWidth="2.394"
          rx="6.227"
        />
        <Path
          fill="#FFF"
          stroke="#142533"
          stroke-width="2.394"
          d="M135 1.197c-10.937 0-19.803 8.866-19.803 19.803 0 10.937 8.866 19.803 19.803 19.803h135A2.803 2.803 0 0 0 272.803 38V4A2.803 2.803 0 0 0 270 1.197H135z"
        />
        <Circle
          cx="135"
          cy="21"
          r="10.5"
          stroke="#142533"
          strokeLinejoin="square"
        />
        <Circle cx="135" cy="21" r="11.5" stroke="#D8D8D8" />
        <G>
          <Circle
            cx="25"
            cy="21"
            r="10.5"
            stroke="#142533"
            strokeLinejoin="square"
          />
          <Circle
            cx="25"
            cy="21"
            r="11.5"
            stroke="#6490F1"
            strokeOpacity=".2"
          />
        </G>
      </G>
    </Svg>
  );
}
