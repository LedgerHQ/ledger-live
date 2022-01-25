// @flow
import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number,
  color: string,
};

export default function Pie({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        d="M12.863 10.572a.842.842 0 0 1 1.551.656 7.477 7.477 0 1 1-9.877-9.765.842.842 0 1 1 .674 1.544 5.793 5.793 0 1 0 7.652 7.565zm2.984-3.095a.842.842 0 0 1-.842.842H8.37a.842.842 0 0 1-.842-.842V.842c0-.465.377-.842.842-.842a7.477 7.477 0 0 1 7.477 7.477zm-6.635-.842h4.89a5.793 5.793 0 0 0-4.89-4.89v4.89z"
        fill={color}
        fillRule="nonzero"
      />
    </Svg>
  );
}
