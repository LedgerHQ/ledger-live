// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";
import colors from "../colors";

interface Props {
  color?: string;
  size?: number;
}

export default function PowerIcon({ color = colors.black, size = 16 }: Props) {
  return (
    <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <Path
        d="M6.65723 9.40909L8.21921 10.9711L11.3432 7.84711"
        stroke={color}
        stroke-width="1.5"
      />
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.63647 0V18H2.45466H3.13647H14.8637L15.5456 18L16.3637 18L16.3637 5.72727L14.8637 4.22727L12.1365 1.5L10.6365 0H3.13647H2.45466H1.63647ZM10.6365 1.5H3.13647V16.5L14.8637 16.5L14.8637 5.72727L14.2424 5.72727H12.1365H10.6365V4.22727V2.12132V1.5ZM12.1365 3.62132L12.7424 4.22727H12.1365V3.62132Z"
      />
    </Svg>
  );
}
