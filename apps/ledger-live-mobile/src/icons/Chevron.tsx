import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
};
export default function Chevron({ size = 10, color }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 6" fill="none">
      <Path
        d="M1.3635 1.18181L4.99987 4.81818L8.63623 1.18181"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
