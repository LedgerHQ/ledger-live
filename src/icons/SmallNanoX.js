// @flow

import React from "react";
import Svg, { Path, G, Circle } from "react-native-svg";

type Props = {
  size?: number,
  style?: *,
};

export default function SmallNanoX({ size, style }: Props) {
  return (
    <Svg
      width={(size && (size / 56) * 10) || 10}
      height={size || 56}
      viewBox="0 0 10 56"
      style={style}
    >
      <G fill="none" fillRule="evenodd">
        <Path
          fill="#6490F1"
          fillOpacity=".1"
          stroke="#1D2028"
          strokeWidth="1.167"
          d="M1.244.583a.661.661 0 0 0-.66.661v53.512c0 .365.295.66.66.66h7.512a.661.661 0 0 0 .66-.66V1.244a.661.661 0 0 0-.66-.66H1.244z"
        />
        <Path
          fill="#FFF"
          stroke="#6490F1"
          strokeWidth=".5"
          d="M3.122 10.25a.372.372 0 0 0-.372.372v10.756c0 .205.167.372.372.372h3.756a.372.372 0 0 0 .372-.372V10.622a.372.372 0 0 0-.372-.372H3.122z"
        />
        <Path
          fill="#FFF"
          stroke="#1D2028"
          strokeWidth="1.167"
          d="M5 24.583A4.417 4.417 0 0 0 .583 29v25.756c0 .365.296.66.661.66h7.512a.661.661 0 0 0 .66-.66V29A4.417 4.417 0 0 0 5 24.583z"
        />
        <Circle
          cx="5"
          cy="28.9"
          r="2.25"
          fill="#FFF"
          stroke="#6490F1"
          strokeWidth=".5"
        />
        <Circle
          cx="5"
          cy="5.5"
          r="2.25"
          fill="#FFF"
          stroke="#6490F1"
          strokeWidth=".5"
        />
      </G>
    </Svg>
  );
}
