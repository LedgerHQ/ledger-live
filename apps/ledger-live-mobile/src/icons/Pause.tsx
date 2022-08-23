import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size: number;
  color: string;
};
export default function Pause({ size = 16, color }: Props) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size}>
      <Path
        fill={color}
        d="M8 14.3A6.3 6.3 0 1 0 8 1.7a6.3 6.3 0 0 0 0 12.6zm0 1.4A7.7 7.7 0 1 1 8 .3a7.7 7.7 0 0 1 0 15.4zm-2.1-5.6V5.9c0-.933 1.4-.933 1.4 0v4.2c0 .933-1.4.933-1.4 0zm2.8 0V5.9c0-.933 1.4-.933 1.4 0v4.2c0 .933-1.4.933-1.4 0z"
      />
    </Svg>
  );
}
