// @flow

import React from "react";
import Svg, { Path, G, Rect, Circle } from "react-native-svg";

export default function EmptyAccountsIllustration() {
  return (
    <Svg width="256" height="66" viewBox="0 0 256 66">
      <G fill="none" fill-rule="evenodd">
        <Path
          fill="#F9F9F9"
          stroke="#D8D8D8"
          strokeOpacity=".5"
          d="M238.586 5.5H16.5V4A3.5 3.5 0 0 1 20 .5h215.086a3.5 3.5 0 0 1 3.5 3.5v1.5zM247.043 10.5H8.5V9A3.5 3.5 0 0 1 12 5.5h231.543a3.5 3.5 0 0 1 3.5 3.5v1.5z"
        />
        <Rect
          width="255"
          height="55"
          x=".5"
          y="10.5"
          fill="#FFF"
          fillOpacity=".5"
          stroke="#D8D8D8"
          rx="4"
        />
        <G fillRule="nonzero" opacity=".6" transform="translate(16 26)">
          <Rect
            width="67.375"
            height="2"
            x="156.625"
            y="6"
            fill="#999"
            rx="1"
          />
          <Rect
            width="40.25"
            height="2"
            x="183.75"
            y="16"
            fill="#D8D8D8"
            rx="1"
          />
          <Rect
            width="56.897"
            height="2"
            x="30.897"
            y="11"
            fill="#999"
            rx="1"
          />
          <Circle cx="12" cy="12" r="12" fill="#999" />
        </G>
      </G>
    </Svg>
  );
}
