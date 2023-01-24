import React from "react";
import Svg, { Path, Circle } from "react-native-svg";

type Props = {
  size?: number;
  color?: string;
  dotColor?: string;
  isOn?: boolean;
};
const SvgComponent = ({ size = 16, color, dotColor, isOn }: Props) => (
  <Svg width={size} height={size} fill="none">
    {isOn ? (
      <>
        <Path
          d="M11.28 2C7.474 2.387 4.5 5.805 4.5 9.964v6H2v2h20v-2h-2.5v-5.162a7.026 7.026 0 0 1-2 .144v5.018h-11v-6c0-3.039 2.017-5.394 4.5-5.9v-.1c0-.682.097-1.341.28-1.964ZM15 21.963H9v-2h6v2Z"
          fill={color}
        />
        <Circle cx={18} cy={4} r={4} fill={dotColor} />
      </>
    ) : (
      <>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M22 18v-2h-2.5v-6c0-4.418-3.358-8-7.5-8-4.142 0-7.5 3.582-7.5 8v6H2v2h20ZM6.5 16v-6c0-3.437 2.582-6 5.5-6s5.5 2.563 5.5 6v6h-11Z"
          fill={color}
        />
        <Path d="M9 22h6v-2H9v2Z" fill={color} />
      </>
    )}
  </Svg>
);

export default SvgComponent;
